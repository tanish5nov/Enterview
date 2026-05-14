import { Router }       from 'express'
import { v4 as uuidv4 } from 'uuid'
import { createSession } from '../session-store.js'
import { Session }       from '../models/Session.js'
import { logger }        from '../logger.js'

const router = Router()

// POST /session/create
router.post('/create', async (req, res) => {
  try {
    const { subject, profile, resumeText, jdText } = req.body

    if (!subject || !profile) {
      return res.status(400).json({ error: 'subject and profile are required' })
    }

    const sessionId = uuidv4()

    createSession(sessionId, { subject, profile, resumeText, jdText })

    await Session.create({ sessionId, subject, candidateProfile: profile })

    logger.info('Session created', { sessionId, subject })
    res.json({ sessionId })
  } catch (err) {
    logger.error('Session create failed', { error: err.message })
    res.status(500).json({ error: 'Failed to create session' })
  }
})

export default router
