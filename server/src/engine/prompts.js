import { prepareTreeForLLM } from './tree.js'

// ─── system prompts ───────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are a senior software engineer conducting a technical interview.
You ask focused questions, follow up on weak answers, and probe depth of understanding.
You maintain a conversation tree to track threads and ensure thorough topic coverage.

RULES:
- Ask exactly one clear question at a time
- Follow up when an answer is vague or incomplete
- Move to a new topic when the current thread is exhausted
- End the session after 10-15 turns or when all pending topics are covered

OUTPUT — return ONLY valid JSON, no prose, no markdown. Example structure (use your own content):
{
  "session_complete": false,
  "new_nodes": [
    { "question": "Your next interview question here", "topic": "Topic Name", "depth": 1 }
  ],
  "activate_node_id": null,
  "context_update": {
    "current_focus": "Topic Name",
    "observation": "brief quality note",
    "covered_topic": "",
    "candidate_summary": "one sentence summary"
  }
}

Your question MUST be specifically about the subject in <subject>.`

export const FIRST_QUESTION_SYSTEM_PROMPT = `You are a technical interviewer. Generate the opening interview question about the subject given in <subject>.
Return ONLY a JSON object with no prose. Example format: { "question": "...", "topic": "..." }
Your question MUST be specifically about the subject in <subject>. Do not ask about unrelated topics.`

export const REPORT_SYSTEM_PROMPT = `You are a technical interviewer writing a post-interview evaluation.
Return ONLY valid JSON, no prose, no markdown:
{
  "overall_score": <1-10>,
  "strengths": ["strength 1", "strength 2"],
  "areas_to_improve": ["area 1", "area 2"],
  "topic_scores": [{ "topic": "<name>", "score": <1-10> }],
  "verdict": "<2-3 sentence honest verdict>",
  "recommendation": "strong_hire|hire|maybe|no_hire"
}`

// ─── prompt builders ──────────────────────────────────────────────────────────

export function buildFirstQuestionPrompt(subject, profile) {
  return `<subject>${subject}</subject>
<candidate>
Name: ${profile.name}
Skills: ${profile.skills.join(', ')}
Projects: ${profile.projects.map(p => p.name).join(', ')}
Experience: ${profile.experience_level}
</candidate>

Generate the opening question for a ${subject} interview. Start with fundamentals.`
}

export function buildTurnPrompt(session, answer, code, codeOutput) {
  const { subject, profile, tree } = session
  const { nodes, context }         = prepareTreeForLLM(tree)

  let prompt = `<subject>${subject}</subject>
<candidate_profile>
Name: ${profile.name}  Skills: ${profile.skills.join(', ')}  Level: ${profile.experience_level}
</candidate_profile>
<interview_context>
Focus: ${context.current_focus}
Covered: ${context.covered_topics.join(', ') || 'none'}
Pending: ${context.pending_topics.slice(0, 5).join(', ')}
Observations: ${context.observations.slice(-3).join(' | ') || 'none'}
Summary: ${context.candidate_summary || 'none yet'}
Turn: ${session.turns}
</interview_context>
<conversation_tree>
${JSON.stringify(nodes, null, 2)}
</conversation_tree>
<last_answer>${answer}</last_answer>`

  if (code)       prompt += `\n<ide_code>${code}</ide_code>`
  if (codeOutput) prompt += `\n<ide_output>${codeOutput}</ide_output>`

  if (session.turns >= 13) {
    prompt += `\n\nThis is turn ${session.turns + 1}. Wrap up if all major topics are covered — set session_complete to true.`
  }

  prompt += `\n\nIMPORTANT: The interview subject is "${subject}". Your next question in new_nodes MUST be specifically about ${subject}. Do not ask about unrelated topics.`

  return prompt
}

export function buildReportPrompt(session) {
  const { tree, subject } = session
  const { context }       = tree

  return `<subject>${subject}</subject>
<observations>${context.observations.join('\n')}</observations>
<covered_topics>${context.covered_topics.join(', ')}</covered_topics>
<candidate_summary>${context.candidate_summary}</candidate_summary>
<total_turns>${session.turns}</total_turns>

Write the post-interview evaluation.`
}
