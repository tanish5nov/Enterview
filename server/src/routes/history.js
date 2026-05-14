import { Router } from 'express'
import { Session } from '../models/Session.js'
import { Turn }    from '../models/Turn.js'
import { logger }  from '../logger.js'

const router = Router()

// GET /sessions
router.get('/', async (_req, res) => {
  try {
    const sessions = await Session.find(
      {},
      'sessionId subject status createdAt completedAt candidateProfile.name report.verdict report.overall_score report.recommendation'
    ).sort({ createdAt: -1 }).limit(50)

    res.json({ sessions })
  } catch (err) {
    logger.error('History list failed', { error: err.message })
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

// GET /sessions/:id
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id })
    if (!session) return res.status(404).json({ error: 'Session not found' })

    const turns = await Turn.find({ sessionId: req.params.id }).sort({ turnNumber: 1 })
    res.json({ session, turns })
  } catch (err) {
    logger.error('Session detail failed', { error: err.message })
    res.status(500).json({ error: 'Failed to fetch session' })
  }
})

export default router
