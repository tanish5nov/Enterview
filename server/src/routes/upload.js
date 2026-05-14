import { Router }   from 'express'
import multer        from 'multer'
import pdfParse      from 'pdf-parse'
import { sanitize }  from '../engine/sanitize.js'
import { logger }    from '../logger.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
})

// POST /upload/resume
// Extracts text only — no LLM call here (too slow on CPU for a blocking upload).
// The interview prompts receive raw resumeText directly; profile fields are filled
// from the name the user confirms in the UI.
router.post('/resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    let rawText
    if (req.file.mimetype === 'application/pdf') {
      const data = await pdfParse(req.file.buffer)
      rawText    = data.text
    } else {
      rawText = req.file.buffer.toString('utf-8')
    }

    const resumeText = sanitize(rawText, 'resume')

    // lightweight heuristic extraction — no LLM, instant
    const profile = extractProfileHeuristic(resumeText)

    logger.info('Resume uploaded', { name: profile.name, chars: resumeText.length })
    res.json({ profile, resumeText })
  } catch (err) {
    logger.error('Resume upload failed', { error: err.message })
    res.status(500).json({ error: 'Failed to process resume' })
  }
})

// POST /upload/jd
router.post('/jd', upload.single('jd'), async (req, res) => {
  try {
    const rawText = req.file
      ? req.file.buffer.toString('utf-8')
      : (req.body?.text || '')

    if (!rawText.trim()) return res.status(400).json({ error: 'No JD provided' })

    res.json({ jdText: sanitize(rawText, 'jd') })
  } catch (err) {
    logger.error('JD upload failed', { error: err.message })
    res.status(500).json({ error: 'Failed to process JD' })
  }
})

export default router

// ─── heuristic profile extractor ─────────────────────────────────────────────

function extractProfileHeuristic(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // name: first non-empty line that looks like a name (2-4 words, mostly alpha)
  const nameLine = lines.find(l => /^[A-Za-z]+([ '-][A-Za-z]+){1,3}$/.test(l)) || 'Candidate'

  // skills: lines containing common tech keywords
  const TECH_RE = /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Go|Rust|Ruby|PHP|Swift|Kotlin|React|Vue|Angular|Node\.?js|Express|Django|Flask|Spring|SQL|MongoDB|PostgreSQL|MySQL|Redis|Docker|Kubernetes|AWS|GCP|Azure|Git|Linux|HTML|CSS|GraphQL|REST|gRPC)\b/gi
  const skillsSet = new Set()
  text.match(TECH_RE)?.forEach(s => skillsSet.add(s))
  const skills = [...skillsSet].slice(0, 12)

  // projects: lines that follow "Project" or "Projects" header
  const projects = []
  let inProjects = false
  for (const line of lines) {
    if (/^projects?$/i.test(line)) { inProjects = true; continue }
    if (inProjects && /^(experience|education|skills|certifications|awards)/i.test(line)) break
    if (inProjects && line.length > 10 && line.length < 120 && !/^\d{4}/.test(line)) {
      projects.push({ name: line.slice(0, 60), description: '' })
      if (projects.length >= 4) break
    }
  }

  return {
    name:             nameLine,
    experience_level: 'fresher',
    skills,
    projects,
    roles: [],
  }
}
