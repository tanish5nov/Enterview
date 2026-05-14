import { z } from 'zod'
import { chatStructured } from '../llm/index.js'
import { createTree, addNode, updateNodeStatus } from './tree.js'
import { sanitize } from './sanitize.js'
import {
  SYSTEM_PROMPT,
  FIRST_QUESTION_SYSTEM_PROMPT,
  REPORT_SYSTEM_PROMPT,
  buildFirstQuestionPrompt,
  buildTurnPrompt,
  buildReportPrompt,
} from './prompts.js'
import { logger } from '../logger.js'
import { setTree, incrementTurns } from '../session-store.js'

// ─── schemas ──────────────────────────────────────────────────────────────────

const noPlaceholder = z.string().min(1).refine(
  s => !/<[^>]+>/.test(s),
  'contains unresolved template placeholder'
)

const FirstQuestionSchema = z.object({
  question: noPlaceholder,
  topic:    noPlaceholder,
})

const TurnOutputSchema = z.object({
  session_complete: z.boolean(),
  new_nodes: z.array(z.object({
    question: noPlaceholder,
    topic:    noPlaceholder,
    depth:    z.number().int().min(0).max(10),
  })).min(1),
  activate_node_id: z.string().nullable().optional(),
  context_update: z.object({
    current_focus:     z.string().optional(),
    observation:       z.string().optional(),
    covered_topic:     z.string().optional(),
    candidate_summary: z.string().optional(),
  }).optional(),
})

const ReportSchema = z.object({
  overall_score:    z.number().min(1).max(10),
  strengths:        z.array(z.string()),
  areas_to_improve: z.array(z.string()),
  topic_scores:     z.array(z.object({
    topic: z.string(),
    score: z.number().min(1).max(10),
  })),
  verdict:        z.string(),
  recommendation: z.enum(['strong_hire', 'hire', 'maybe', 'no_hire']),
})

// ─── fallbacks ────────────────────────────────────────────────────────────────

const TURN_FALLBACK = {
  new_nodes:        [{ question: 'Can you elaborate on that? Walk me through your reasoning.', topic: 'General', depth: 1 }],
  activate_node_id: null,
  context_update:   {},
  session_complete: false,
}

const REPORT_FALLBACK = {
  overall_score:    5,
  strengths:        ['Completed the interview'],
  areas_to_improve: ['Needs further practice'],
  topic_scores:     [],
  verdict:          'Average performance across topics.',
  recommendation:   'maybe',
}

// ─── generateFirstQuestion ───────────────────────────────────────────────────

export async function generateFirstQuestion(session) {
  const { subject, profile, sessionId } = session

  const tree = createTree(sessionId, subject)

  const fallback = { question: `Tell me about your understanding of ${subject}.`, topic: subject }
  const prompt   = `${FIRST_QUESTION_SYSTEM_PROMPT}\n\n${buildFirstQuestionPrompt(subject, profile)}`
  const result   = await chatStructured(prompt, FirstQuestionSchema, fallback)

  const rootId = addNode(tree, null, {
    type:     'interviewer_question',
    status:   'active',
    question: result.question,
    topic:    result.topic,
    depth:    0,
    summary:  null,
  })

  tree.context.active_node_id = rootId

  setTree(sessionId, tree)
  session.tree = tree

  logger.info('First question generated', { sessionId, topic: result.topic })
  return result.question
}

// ─── processTurn ─────────────────────────────────────────────────────────────

export async function processTurn(session, rawAnswer, includeCode, rawCode, rawCodeOutput) {
  const answer     = sanitize(rawAnswer,          'answer')
  const code       = includeCode ? sanitize(rawCode       || '', 'code')   : null
  const codeOutput = includeCode ? sanitize(rawCodeOutput || '', 'answer') : null

  const { tree, sessionId } = session
  const activeId = tree.context.active_node_id

  // record response as a tree node
  const responseId = addNode(tree, activeId, {
    type:      'interviewee_response',
    status:    'explored',
    answer,
    parent_id: null,
  })

  if (activeId) updateNodeStatus(tree, activeId, 'explored')

  const prompt      = `${SYSTEM_PROMPT}\n\n${buildTurnPrompt(session, answer, code, codeOutput)}`
  const turnOutput  = await chatStructured(prompt, TurnOutputSchema, TURN_FALLBACK)

  // add new question nodes as children of the response
  const addedIds = []
  for (const n of turnOutput.new_nodes) {
    const id = addNode(tree, responseId, {
      type:     'interviewer_question',
      status:   'pending',
      question: n.question,
      topic:    n.topic,
      depth:    n.depth,
      summary:  null,
    })
    addedIds.push(id)
  }

  // activate LLM's chosen node or default to first new node
  const activateId =
    turnOutput.activate_node_id && tree.nodes[turnOutput.activate_node_id]
      ? turnOutput.activate_node_id
      : addedIds[0]

  if (activateId) updateNodeStatus(tree, activateId, 'active')

  // apply context updates
  const cu = turnOutput.context_update ?? {}
  if (cu.current_focus)     tree.context.current_focus     = cu.current_focus
  if (cu.candidate_summary) tree.context.candidate_summary = cu.candidate_summary
  if (cu.observation)       tree.context.observations.push(cu.observation)
  if (cu.covered_topic && cu.covered_topic !== '') {
    if (!tree.context.covered_topics.includes(cu.covered_topic)) {
      tree.context.covered_topics.push(cu.covered_topic)
    }
    tree.context.pending_topics = tree.context.pending_topics.filter(t => t !== cu.covered_topic)
  }

  incrementTurns(sessionId)

  // small models often set session_complete too early — enforce a minimum of 6 turns
  const sessionComplete = turnOutput.session_complete && session.turns >= 6

  const nextQuestion = tree.nodes[activateId]?.question
    ?? 'Thank you for that answer. Shall we move on?'

  logger.info('Turn processed', { sessionId, turn: session.turns, complete: sessionComplete })

  return {
    question:        nextQuestion,
    sessionComplete: sessionComplete,
  }
}

// ─── generateReport ──────────────────────────────────────────────────────────

export async function generateReport(session) {
  const prompt = `${REPORT_SYSTEM_PROMPT}\n\n${buildReportPrompt(session)}`
  return chatStructured(prompt, ReportSchema, REPORT_FALLBACK)
}
