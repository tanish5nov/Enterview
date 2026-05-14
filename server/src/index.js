import { createServer }  from 'http'
import express           from 'express'
import { getConfig }     from './config.js'
import { connectToMongo } from './db.js'
import { getHealthSnapshot } from './health.js'
import { checkOllama }   from './llm/index.js'
import { logger }        from './logger.js'
import { requestLogger } from './request-logger.js'
import { initWebSocketServer } from './ws/index.js'
import uploadRoutes      from './routes/upload.js'
import sessionRoutes     from './routes/session.js'
import codeRoutes        from './routes/code.js'
import roastRoutes       from './routes/roast.js'
import historyRoutes     from './routes/history.js'

const app    = express()
const server = createServer(app)

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

// ─── CORS (dev) ───────────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (_req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// ─── routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  const snapshot = getHealthSnapshot()
  res.status(snapshot.ok ? 200 : 503).json(snapshot)
})

app.use('/upload',   uploadRoutes)
app.use('/session',  sessionRoutes)
app.use('/code',     codeRoutes)
app.use('/roast',    roastRoutes)
app.use('/sessions', historyRoutes)

// ─── global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message })
  res.status(500).json({ ok: false, error: 'Internal server error' })
})

// ─── startup ─────────────────────────────────────────────────────────────────
async function start() {
  const config = getConfig()

  await connectToMongo(config.mongodbUri)
  await checkOllama()   // block until model is ready — prevents 404s on first request

  initWebSocketServer(server)

  server.listen(config.port, () => {
    logger.info('Server listening', { url: `http://localhost:${config.port}` })
  })
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message })
  process.exit(1)
})
