// Integration tests — run with: node src/test/integration.js
// Requires server running on http://localhost:8080

const BASE = 'http://localhost:8080'
let passed = 0, failed = 0

async function t(label, fn) {
  try {
    await fn()
    console.log(`PASS — ${label}`)
    passed++
  } catch (e) {
    console.error(`FAIL — ${label}: ${e.message}`)
    failed++
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed')
}

// ─── health ───────────────────────────────────────────────────────────────────

await t('GET /health returns 200 or 503', async () => {
  const res = await fetch(`${BASE}/health`)
  assert(res.status === 200 || res.status === 503, `unexpected status ${res.status}`)
  const data = await res.json()
  assert('ok' in data, 'missing ok field')
  assert('mongo' in data, 'missing mongo field')
  assert('ollama' in data, 'missing ollama field')
  console.log('  health:', JSON.stringify(data))
})

// ─── session/create (no resume needed — pass profile directly) ────────────────

let sessionId
await t('POST /session/create returns sessionId', async () => {
  const res = await fetch(`${BASE}/session/create`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: 'DSA',
      profile: {
        name:             'Test Candidate',
        experience_level: 'fresher',
        skills:           ['JavaScript', 'C++', 'Python'],
        projects:         [{ name: 'Portfolio', description: 'Personal website' }],
        roles:            [],
      },
      resumeText: 'Test candidate with JavaScript and C++ skills.',
      jdText: null,
    }),
  })
  assert(res.status === 200, `status ${res.status}`)
  const data = await res.json()
  assert(typeof data.sessionId === 'string', 'sessionId missing')
  sessionId = data.sessionId
  console.log('  sessionId:', sessionId)
})

// ─── GET /sessions ─────────────────────────────────────────────────────────────

await t('GET /sessions returns array', async () => {
  const res = await fetch(`${BASE}/sessions`)
  assert(res.status === 200, `status ${res.status}`)
  const data = await res.json()
  assert(Array.isArray(data.sessions), 'sessions should be array')
})

// ─── GET /sessions/:id ────────────────────────────────────────────────────────

await t('GET /sessions/:id returns session', async () => {
  if (!sessionId) throw new Error('no sessionId from earlier test')
  const res = await fetch(`${BASE}/sessions/${sessionId}`)
  assert(res.status === 200, `status ${res.status}`)
  const data = await res.json()
  assert(data.session.sessionId === sessionId, 'wrong sessionId')
  assert(Array.isArray(data.turns), 'turns should be array')
})

// ─── code/run ────────────────────────────────────────────────────────────────

await t('POST /code/run — hello world', async () => {
  const res = await fetch(`${BASE}/code/run`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: '#include<iostream>\nusing namespace std;\nint main(){cout<<"hello"<<endl;return 0;}',
      stdin: '',
    }),
  })
  assert(res.status === 200 || res.status === 503, `status ${res.status}`)
  const data = await res.json()
  if (res.status === 503) {
    console.log('  g++ not available on server (expected in dev without Docker)')
    return
  }
  assert(!data.compilationError, `compile error: ${data.compilationError}`)
  assert(data.stdout.trim() === 'hello', `expected "hello" got "${data.stdout.trim()}"`)
})

await t('POST /code/run — compilation error', async () => {
  const res = await fetch(`${BASE}/code/run`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'this is not valid cpp', stdin: '' }),
  })
  assert(res.status === 200 || res.status === 503, `status ${res.status}`)
  if (res.status === 503) return
  const data = await res.json()
  assert(!!data.compilationError, 'should have compilationError')
  assert(data.stdout === '', 'stdout should be empty on compile error')
})

await t('POST /code/run — timeout', async () => {
  const res = await fetch(`${BASE}/code/run`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'int main(){while(1){}}', stdin: '' }),
  })
  assert(res.status === 200 || res.status === 503, `status ${res.status}`)
  if (res.status === 503) return
  const data = await res.json()
  assert(data.timedOut === true, `expected timedOut=true, got ${JSON.stringify(data)}`)
}, 12000)

await t('POST /code/run — rate limit at 11th run', async () => {
  const limitedId = 'rate-limit-test-' + Date.now()
  for (let i = 0; i < 10; i++) {
    await fetch(`${BASE}/code/run`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'int main(){}', stdin: '', sessionId: limitedId }),
    })
  }
  const res = await fetch(`${BASE}/code/run`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'int main(){}', stdin: '', sessionId: limitedId }),
  })
  assert(res.status === 429, `expected 429 got ${res.status}`)
})

// ─── upload/resume (plain text) ───────────────────────────────────────────────

await t('POST /upload/resume — plain text file', async () => {
  const content = 'John Doe\nSoftware Engineer\nSkills: React, Node.js, Python\nProjects: Todo App (MERN stack)'
  const blob = new Blob([content], { type: 'text/plain' })
  const fd   = new FormData()
  fd.append('resume', blob, 'resume.txt')
  const res = await fetch(`${BASE}/upload/resume`, { method: 'POST', body: fd })
  assert(res.status === 200, `status ${res.status}`)
  const data = await res.json()
  assert(typeof data.profile === 'object', 'profile should be object')
  assert(typeof data.resumeText === 'string', 'resumeText should be string')
  console.log('  extracted name:', data.profile.name)
  console.log('  skills:', data.profile.skills?.join(', '))
})

// ─── WebSocket ────────────────────────────────────────────────────────────────

await t('WebSocket connects and handles session:start', async () => {
  if (!sessionId) throw new Error('no sessionId')
  const { WebSocket: WS } = await import('ws')
  await new Promise((resolve, reject) => {
    const ws = new WS('ws://localhost:8080')
    const timeout = setTimeout(() => { ws.close(); reject(new Error('timeout')) }, 20000)

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'session:start', payload: {}, sessionId }))
    })

    ws.on('message', (raw) => {
      const { type, payload } = JSON.parse(raw.toString())
      if (type === 'question:complete') {
        assert(typeof payload.question === 'string', 'question should be string')
        assert(payload.question.length > 0, 'question should not be empty')
        console.log('  first question:', payload.question.slice(0, 80) + '...')
        clearTimeout(timeout)
        ws.close()
        resolve()
      } else if (type === 'session:error') {
        clearTimeout(timeout)
        ws.close()
        reject(new Error(`session:error — ${payload.message}`))
      }
    })

    ws.on('error', (e) => { clearTimeout(timeout); reject(e) })
  })
})

// ─── summary ─────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
