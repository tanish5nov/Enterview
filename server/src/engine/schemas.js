import { z } from 'zod'

// ─── node status ──────────────────────────────────────────────────────────────

export const NodeStatus = z.enum(['pending', 'active', 'explored', 'skipped'])

// ─── tree nodes ───────────────────────────────────────────────────────────────

export const InterviewerQuestionSchema = z.object({
  id:        z.string(),
  type:      z.literal('interviewer_question'),
  status:    NodeStatus,
  question:  z.string(),
  topic:     z.string(),
  depth:     z.number().int().min(0),
  parent_id: z.string().nullable(),
  children:  z.array(z.string()),   // child node ids
  summary:   z.string().nullable(), // set when collapsed
})

export const IntervieweeResponseSchema = z.object({
  id:        z.string(),
  type:      z.literal('interviewee_response'),
  status:    NodeStatus,
  answer:    z.string(),
  parent_id: z.string().nullable(),
  children:  z.array(z.string()),
})

export const NodeSchema = z.discriminatedUnion('type', [
  InterviewerQuestionSchema,
  IntervieweeResponseSchema,
])

// ─── context object ───────────────────────────────────────────────────────────
// The LLM's persistent working memory — passed with every ANALYZE + GENERATE call

export const ContextSchema = z.object({
  current_focus:     z.string(),           // topic the session is currently probing
  active_node_id:    z.string().nullable(),
  observations:      z.array(z.string()),  // LLM running notes on candidate quality
  covered_topics:    z.array(z.string()),
  pending_topics:    z.array(z.string()),
  contradictions:    z.array(z.string()),  // spotted inconsistencies
  candidate_summary: z.string(),
  started_at:        z.number(),           // epoch ms
})

// ─── tree root ────────────────────────────────────────────────────────────────

export const TreeSchema = z.object({
  session_id: z.string(),
  subject:    z.string(),
  nodes:      z.record(z.string(), NodeSchema), // nodeId → node
  root_id:    z.string().nullable(),
  context:    ContextSchema,
})
