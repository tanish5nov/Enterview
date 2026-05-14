import { WebSocketServer } from 'ws'
import { logger }          from '../logger.js'
import { CLIENT_EVENTS, SERVER_EVENTS } from './events.js'
import { getSession }      from '../session-store.js'
import { generateFirstQuestion, processTurn, generateReport } from '../engine/orchestrator.js'
import { prepareTreeForLLM } from '../engine/tree.js'
import { Session }         from '../models/Session.js'
import { Turn }            from '../models/Turn.js'

let _wss = null

export function initWebSocketServer(httpServer) {
  _wss = new WebSocketServer({ server: httpServer })

  _wss.on('connection', (ws) => {
    logger.info('WebSocket client connected')

    ws.isAlive = true
    ws.on('pong', () => { ws.isAlive = true })

    ws.on('message', (rawData) => {
      try {
        const message = JSON.parse(rawData.toString())
        handleMessage(ws, message)
      } catch {
        sendTo(ws, SERVER_EVENTS.SESSION_ERROR, { message: 'Invalid message format' })
      }
    })

    ws.on('close', () => logger.info('WebSocket client disconnected'))
    ws.on('error', (err) => logger.error('WebSocket error', { error: err.message }))
  })

  // heartbeat — drop stale connections every 30s
  const heartbeat = setInterval(() => {
    _wss.clients.forEach((ws) => {
      if (!ws.isAlive) { ws.terminate(); return }
      ws.isAlive = false
      ws.ping()
    })
  }, 30_000)

  _wss.on('close', () => clearInterval(heartbeat))

  logger.info('WebSocket server initialised')
  return _wss
}

// ─── message router ───────────────────────────────────────────────────────────

function handleMessage(ws, message) {
  const { type, payload = {}, sessionId } = message

  switch (type) {
    case CLIENT_EVENTS.SESSION_START:
      handleSessionStart(ws, { ...payload, sessionId })
      break
    case CLIENT_EVENTS.ANSWER_SUBMIT:
      handleAnswerSubmit(ws, { ...payload, sessionId })
      break
    case CLIENT_EVENTS.SESSION_END:
      handleSessionEnd(ws, { sessionId })
      break
    default:
      sendTo(ws, SERVER_EVENTS.SESSION_ERROR, { message: `Unknown event: ${type}` })
  }
}

// ─── handlers ─────────────────────────────────────────────────────────────────

async function handleSessionStart(ws, { sessionId }) {
  let session = getSession(sessionId)

  // restore from MongoDB if backend restarted and lost in-memory state
  if (!session) {
    const doc = await Session.findOne({ sessionId }).catch(() => null)
    if (!doc) {
      return sendTo(ws, SERVER_EVENTS.SESSION_ERROR, {
        message: 'Session not found. Please refresh and start a new interview.',
      })
    }
    // re-hydrate in-memory session from DB record
    const { createSession, setTree } = await import('../session-store.js')
    createSession(sessionId, {
      subject:    doc.subject,
      profile:    doc.candidateProfile || {},
      resumeText: '',
      jdText:     null,
    })
    if (doc.treeSnapshot) setTree(sessionId, doc.treeSnapshot)
    session = getSession(sessionId)
  }

  // if session already has a tree (resumed mid-interview), replay the last question
  if (session.tree?.context?.active_node_id) {
    const activeNode = session.tree.nodes[session.tree.context.active_node_id]
    if (activeNode) {
      sendTo(ws, SERVER_EVENTS.QUESTION_COMPLETE, { question: activeNode.question, turn: session.turns })
      sendTo(ws, SERVER_EVENTS.TREE_UPDATE, { tree: prepareTreeForLLM(session.tree) })
      logger.info('session resumed from snapshot', { sessionId })
      return
    }
  }

  try {
    const question    = await generateFirstQuestion(session)
    const treePayload = prepareTreeForLLM(session.tree)

    sendTo(ws, SERVER_EVENTS.QUESTION_COMPLETE, { question, turn: 0 })
    sendTo(ws, SERVER_EVENTS.TREE_UPDATE, { tree: treePayload })
    logger.info('session:start handled', { sessionId })
  } catch (err) {
    logger.error('session:start failed', { sessionId, error: err.message })
    sendTo(ws, SERVER_EVENTS.SESSION_ERROR, { message: 'Failed to start session' })
  }
}

async function handleAnswerSubmit(ws, { sessionId, answer, includeCode, code, codeOutput }) {
  const session = getSession(sessionId)
  if (!session) {
    return sendTo(ws, SERVER_EVENTS.SESSION_ERROR, {
      message: 'Session expired. Please refresh and start a new interview.',
    })
  }
  if (!answer?.trim()) {
    return sendTo(ws, SERVER_EVENTS.SESSION_ERROR, { message: 'Answer cannot be empty' })
  }

  // capture current question before processTurn advances the tree
  const currentQuestion = session.tree?.nodes[session.tree?.context?.active_node_id]?.question || ''
  const currentTopic    = session.tree?.context?.current_focus || ''

  try {
    // persist turn to MongoDB (best-effort — session continues even if write fails)
    Turn.create({
      sessionId,
      turnNumber:  session.turns,
      question:    currentQuestion,
      answer,
      topic:       currentTopic,
      code:        includeCode ? code : null,
      codeOutput:  includeCode ? codeOutput : null,
    }).catch(err => logger.warn('Turn write failed', { error: err.message }))

    const { question, sessionComplete } = await processTurn(
      session, answer, includeCode, code, codeOutput
    )

    const treePayload = prepareTreeForLLM(session.tree)

    // persist tree snapshot after every turn so a WS drop doesn't lose progress
    Session.findOneAndUpdate(
      { sessionId },
      { treeSnapshot: session.tree }
    ).catch(err => logger.warn('Tree snapshot write failed', { error: err.message }))

    if (sessionComplete) {
      const report = await generateReport(session)

      Session.findOneAndUpdate(
        { sessionId },
        { report, status: 'completed', completedAt: new Date() }
      ).catch(err => logger.warn('Session report write failed', { error: err.message }))

      sendTo(ws, SERVER_EVENTS.REPORT_READY, { report })
    } else {
      sendTo(ws, SERVER_EVENTS.QUESTION_COMPLETE, { question, turn: session.turns })
      sendTo(ws, SERVER_EVENTS.TREE_UPDATE, { tree: treePayload })
    }
  } catch (err) {
    logger.error('answer:submit failed', { sessionId, error: err.message })
    sendTo(ws, SERVER_EVENTS.SESSION_ERROR, { message: 'Failed to process answer' })
  }
}

async function handleSessionEnd(ws, { sessionId }) {
  const session = getSession(sessionId)
  if (!session) return

  try {
    const report = await generateReport(session)

    Session.findOneAndUpdate(
      { sessionId },
      { report, status: 'completed', completedAt: new Date() }
    ).catch(err => logger.warn('Session end write failed', { error: err.message }))

    sendTo(ws, SERVER_EVENTS.REPORT_READY, { report })
    logger.info('session:end handled', { sessionId })
  } catch (err) {
    logger.error('session:end failed', { sessionId, error: err.message })
    sendTo(ws, SERVER_EVENTS.SESSION_ERROR, { message: 'Failed to end session' })
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

export function sendTo(ws, type, payload) {
  if (ws.readyState === 1 /* OPEN */) {
    ws.send(JSON.stringify({ type, payload }))
  }
}

export function getWss() {
  return _wss
}
