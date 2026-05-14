import { Router }        from 'express'
import { z }             from 'zod'
import { chatStructured } from '../llm/index.js'
import { getSession }    from '../session-store.js'
import { Session }       from '../models/Session.js'
import { logger }        from '../logger.js'

const router = Router()

const RoastReportSchema = z.object({
  overall_impression:      z.string(),
  strengths:               z.array(z.string()),
  weak_areas:              z.array(z.string()),
  project_feedback:        z.array(z.object({ project: z.string(), feedback: z.string() })),
  skills_gap:              z.array(z.string()),
  improvement_suggestions: z.array(z.string()),
  verdict:                 z.string(),
})

const ROAST_FALLBACK = {
  overall_impression:      'Resume reviewed.',
  strengths:               ['Shows initiative in applying'],
  weak_areas:              ['Resume lacks quantified achievements'],
  project_feedback:        [],
  skills_gap:              [],
  improvement_suggestions: ['Add metrics to project descriptions', 'List concrete technical contributions'],
  verdict:                 'Average resume. Significant room for improvement.',
}

// track in-flight roast calls to prevent duplicate LLM calls for the same session
const roastInFlight = new Set()

// POST /roast
router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' })

    const session = getSession(sessionId)
    if (!session) return res.status(404).json({ error: 'Session not found' })

    // return cached result if already completed
    const existing = await Session.findOne({ sessionId, status: 'completed', report: { $exists: true } }).lean()
    if (existing?.report) return res.json({ report: existing.report })

    // prevent duplicate concurrent calls for the same session
    if (roastInFlight.has(sessionId)) {
      return res.status(429).json({ error: 'Roast already in progress for this session' })
    }
    roastInFlight.add(sessionId)

    const { resumeText, jdText } = session
    if (!resumeText) return res.status(400).json({ error: 'No resume found in session' })

    const jdSection = jdText
      ? `<job_description>${jdText}</job_description>`
      : `<job_description>Generic SWE university graduate position at a mid-size product company</job_description>`

    const prompt = `You are a brutally honest senior technical recruiter doing a resume roast.
Be specific, direct, and actionable. Call out vague language, missing impact, and skills gaps.
Do not sugarcoat.

Return ONLY this JSON object:
{
  "overall_impression": "<2-3 sentence first impression>",
  "strengths": ["concrete strength 1"],
  "weak_areas": ["specific weak area 1"],
  "project_feedback": [{ "project": "<name>", "feedback": "<honest one-line assessment>" }],
  "skills_gap": ["missing skill relevant to JD"],
  "improvement_suggestions": ["specific action to take"],
  "verdict": "<one punchy verdict sentence>"
}

<resume>${resumeText}</resume>
${jdSection}`

    let report
    try {
      report = await chatStructured(prompt, RoastReportSchema, ROAST_FALLBACK)
    } finally {
      roastInFlight.delete(sessionId)
    }

    await Session.findOneAndUpdate(
      { sessionId },
      { report, status: 'completed', completedAt: new Date() }
    )

    logger.info('Roast complete', { sessionId })
    res.json({ report })
  } catch (err) {
    roastInFlight.delete(sessionId)
    logger.error('Roast failed', { error: err.message })
    res.status(500).json({ error: 'Roast failed' })
  }
})

export default router
