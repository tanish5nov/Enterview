// End-to-end interview loop + roast test
// Run: OLLAMA_URL=http://localhost:11435 node --env-file=.env src/test/e2e.js

import { WebSocket } from 'ws'

const BASE = 'http://localhost:8080'
let pass = 0, fail = 0

function ok(label) { console.log(`PASS — ${label}`); pass++ }
function ko(label, e) { console.error(`FAIL — ${label}: ${e.message}`); fail++ }

// ─── helpers ─────────────────────────────────────────────────────────────────

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

function wsFlow(sessionId, steps) {
  return new Promise((resolve, reject) => {
    const ws      = new WebSocket('ws://localhost:8080')
    let stepIndex = 0
    const timeout = setTimeout(() => { ws.close(); reject(new Error('WebSocket timeout')) }, 60000)

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'session:start', payload: {}, sessionId }))
    })

    ws.on('message', (raw) => {
      const { type, payload } = JSON.parse(raw.toString())

      if (type === 'session:error') {
        clearTimeout(timeout); ws.close()
        return reject(new Error(`session:error — ${payload.message}`))
      }

      if (type === 'report:ready') {
        clearTimeout(timeout); ws.close()
        return resolve({ done: true, report: payload.report })
      }

      if (type === 'question:complete') {
        const step = steps[stepIndex]
        if (!step) {
          // no more answers — end session
          ws.send(JSON.stringify({ type: 'session:end', payload: {}, sessionId }))
          return
        }
        stepIndex++
        ws.send(JSON.stringify({
          type:      'answer:submit',
          payload:   { answer: step.answer, includeCode: false, code: null, codeOutput: null },
          sessionId,
        }))
      }
    })

    ws.on('error', (e) => { clearTimeout(timeout); reject(e) })
  })
}

// ─── test 1: full interview loop (2 turns + end) ──────────────────────────────

try {
  const { sessionId } = await post('/session/create', {
    subject: 'DSA',
    profile: {
      name: 'E2E Candidate', experience_level: 'fresher',
      skills: ['C++'], projects: [], roles: [],
    },
    resumeText: 'E2E test candidate.',
  })

  const result = await wsFlow(sessionId, [
    { answer: 'An array is contiguous memory, a linked list uses nodes with pointers.' },
    { answer: 'Array access is O(1) by index; linked list is O(n) because you traverse from head.' },
  ])

  if (result.report) {
    if (result.report.overall_score && result.report.overall_score >= 1) {
      ok('Full interview loop (2 turns + session:end → report:ready)')
      console.log('  score:', result.report.overall_score + '/10')
      console.log('  recommendation:', result.report.recommendation)
    } else {
      throw new Error('report missing overall_score: ' + JSON.stringify(result.report))
    }
  } else {
    throw new Error('no report received')
  }
} catch (e) { ko('Full interview loop', e) }

// ─── test 2: resume roast ─────────────────────────────────────────────────────

try {
  const { sessionId } = await post('/session/create', {
    subject:    'Resume Roasting',
    profile:    { name: 'Roast Candidate', experience_level: 'fresher', skills: [], projects: [], roles: [] },
    resumeText: 'John Doe — React developer, built a todo app.',
    jdText:     'Looking for a senior SWE with 5 years experience in distributed systems.',
  })

  const { report } = await post('/roast', { sessionId })

  if (!report.verdict) throw new Error('no verdict in roast report')
  if (!Array.isArray(report.strengths)) throw new Error('strengths not array')
  if (!Array.isArray(report.weak_areas)) throw new Error('weak_areas not array')

  ok('Resume roast returns structured report')
  console.log('  verdict:', report.verdict)
} catch (e) { ko('Resume roast', e) }

// ─── test 3: history contains completed sessions ──────────────────────────────

try {
  const { sessions } = await get('/sessions')
  const completed = sessions.filter(s => s.status === 'completed')
  if (completed.length === 0) throw new Error('no completed sessions in history')
  ok(`History contains ${completed.length} completed session(s)`)
} catch (e) { ko('History contains completed sessions', e) }

// ─── test 4: session detail has turns ─────────────────────────────────────────

try {
  const { sessions } = await get('/sessions')
  const interview = sessions.find(s => s.subject === 'DSA' && s.status === 'completed')
  if (!interview) throw new Error('DSA completed session not found')

  const { session, turns } = await get(`/sessions/${interview.sessionId}`)
  if (!session.report) throw new Error('report missing from session detail')
  if (!Array.isArray(turns)) throw new Error('turns not array')

  ok(`Session detail: ${turns.length} turn(s) stored, report present`)
} catch (e) { ko('Session detail has turns', e) }

// ─── test 5: empty answer rejected ────────────────────────────────────────────

try {
  const { sessionId } = await post('/session/create', {
    subject: 'OS',
    profile: { name: 'Err Test', experience_level: 'fresher', skills: [], projects: [], roles: [] },
    resumeText: '',
  })

  await new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:8080')
    const timeout = setTimeout(() => { ws.close(); reject(new Error('timeout')) }, 10000)

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'session:start', payload: {}, sessionId }))
    })

    ws.on('message', (raw) => {
      const { type, payload } = JSON.parse(raw.toString())
      if (type === 'question:complete') {
        // now send empty answer
        ws.send(JSON.stringify({
          type: 'answer:submit',
          payload: { answer: '   ', includeCode: false },
          sessionId,
        }))
      }
      if (type === 'session:error' && payload.message.includes('empty')) {
        clearTimeout(timeout); ws.close(); resolve()
      }
    })
    ws.on('error', (e) => { clearTimeout(timeout); reject(e) })
  })

  ok('Empty answer returns session:error')
} catch (e) { ko('Empty answer rejected', e) }

// ─── summary ─────────────────────────────────────────────────────────────────

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
