const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'

const MAX_RETRIES    = 3
const RETRY_DELAY_MS = 2000

let socket           = null
let retries          = 0
let handlers         = {}
let intentionalClose = false
let retryTimer       = null

// track sockets that were explicitly closed by disconnectWS() so onerror
// doesn't reject the promise when StrictMode tears down the fake mount
const closedByUs = new WeakSet()

export function connectWS() {
  intentionalClose = false
  retries          = 0

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL)
    socket = ws

    ws.onopen = () => {
      retries = 0
      resolve()
    }

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data)
        handlers[type]?.forEach(cb => cb(payload))
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      if (!intentionalClose && retries < MAX_RETRIES) {
        retries++
        retryTimer = setTimeout(connectWS, RETRY_DELAY_MS * retries)
      }
    }

    ws.onerror = () => {
      // only reject if this wasn't an intentional close (StrictMode cleanup or navigation)
      if (!closedByUs.has(ws) && retries === 0) {
        reject(new Error('WebSocket connection failed'))
      }
    }
  })
}

export function sendWS(type, payload, sessionId) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload, sessionId }))
  }
}

export function onWS(type, callback) {
  if (!handlers[type]) handlers[type] = []
  handlers[type].push(callback)
}

export function offWS(type, callback) {
  if (!handlers[type]) return
  handlers[type] = handlers[type].filter(cb => cb !== callback)
}

export function disconnectWS() {
  intentionalClose = true
  clearTimeout(retryTimer)
  retryTimer = null
  if (socket) closedByUs.add(socket)
  socket?.close()
  socket   = null
  handlers = {}
  retries  = 0
}
