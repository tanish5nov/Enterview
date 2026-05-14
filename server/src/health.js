let mongoOk = false
let ollamaOk = false

export function setMongoStatus(ok)  { mongoOk  = ok }
export function setOllamaStatus(ok) { ollamaOk = ok }

export function getHealthSnapshot() {
  return {
    ok:        mongoOk && ollamaOk,
    mongo:     mongoOk  ? 'connected'   : 'disconnected',
    ollama:    ollamaOk ? 'reachable'   : 'unreachable',
    timestamp: new Date().toISOString(),
  }
}
