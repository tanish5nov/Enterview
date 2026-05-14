import { Router }              from 'express'
import { exec }                from 'child_process'
import { writeFile, unlink }   from 'fs/promises'
import { v4 as uuidv4 }        from 'uuid'
import { promisify }            from 'util'
import { logger }               from '../logger.js'

const router    = Router()
const execAsync = promisify(exec)
const TIMEOUT   = 5000

const runCounts = new Map() // sessionId → count

// POST /code/run
router.post('/run', async (req, res) => {
  const { code, stdin = '', sessionId } = req.body

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code is required' })
  }

  // per-session rate limit
  if (sessionId) {
    const count = (runCounts.get(sessionId) || 0) + 1
    if (count > 10) {
      return res.status(429).json({ error: 'Run limit reached for this session (max 10)' })
    }
    runCounts.set(sessionId, count)
  }

  const id      = uuidv4()
  const srcFile = `/tmp/${id}.cpp`
  const binFile = `/tmp/${id}.out`
  const inFile  = `/tmp/${id}.stdin`

  try {
    await writeFile(srcFile, code)

    // compile
    try {
      await execAsync(`g++ -o ${binFile} ${srcFile} 2>&1`, { timeout: 15000 })
    } catch (compileErr) {
      return res.json({
        stdout:           '',
        stderr:           '',
        compilationError: compileErr.stdout || compileErr.message,
        timedOut:         false,
      })
    }

    // run with stdin via temp file (safe from shell injection)
    await writeFile(inFile, stdin)

    try {
      const { stdout, stderr } = await execAsync(
        `${binFile} < ${inFile}`,
        { timeout: TIMEOUT }
      )
      return res.json({ stdout, stderr, compilationError: null, timedOut: false })
    } catch (runErr) {
      const timedOut = runErr.killed || runErr.signal === 'SIGTERM'
      return res.json({
        stdout:           runErr.stdout || '',
        stderr:           timedOut ? '' : (runErr.stderr || runErr.message),
        compilationError: null,
        timedOut,
      })
    }
  } catch (err) {
    // g++ not installed
    if (err.code === 'ENOENT' || err.message?.includes('not found')) {
      return res.status(503).json({ error: 'C++ compiler (g++) is not available on this server.' })
    }
    logger.error('Code run failed', { error: err.message })
    return res.status(500).json({ error: 'Code execution failed' })
  } finally {
    Promise.all([
      unlink(srcFile).catch(() => {}),
      unlink(binFile).catch(() => {}),
      unlink(inFile).catch(() => {}),
    ])
  }
})

export default router
