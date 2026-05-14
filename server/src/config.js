function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

let _config = null

export function getConfig() {
  if (_config) return _config

  _config = {
    port: parseInt(process.env.PORT || '8080', 10),
    mongodbUri: required('MONGODB_URI'),
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'qwen2.5:0.5b',
  }

  return _config
}
