import { getConfig } from '../config.js'
import { logger } from '../logger.js'
import { setOllamaStatus } from '../health.js'
import { parseAndValidate } from './validate.js'

// ─── startup check ───────────────────────────────────────────────────────────

export async function checkOllama() {
  const { ollamaUrl, ollamaModel } = getConfig()
  const maxRetries = 5
  const retryDelayMs = 3000

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`)
      if (!res.ok) throw new Error(`Ollama returned ${res.status}`)

      const data = await res.json()
      const modelName = ollamaModel.split(':')[0]
      const modelExists = data.models?.some(m => m.name.startsWith(modelName))

      if (!modelExists) {
        logger.info('Model not found locally, pulling...', { model: ollamaModel })
        await pullModel(ollamaUrl, ollamaModel)
      }

      setOllamaStatus(true)
      logger.info('Ollama ready', { model: ollamaModel })
      return
    } catch (err) {
      logger.warn(`Ollama not ready (attempt ${attempt}/${maxRetries})`, { error: err.message })
      if (attempt === maxRetries) {
        setOllamaStatus(false)
        throw new Error(`Ollama unreachable after ${maxRetries} attempts: ${err.message}`)
      }
      await sleep(retryDelayMs)
    }
  }
}

async function pullModel(ollamaUrl, model) {
  const res = await fetch(`${ollamaUrl}/api/pull`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name: model, stream: false }),
  })
  if (!res.ok) throw new Error(`Failed to pull model ${model}: ${res.status}`)
  logger.info('Model pulled successfully', { model })
}

// ─── single response ──────────────────────────────────────────────────────────

const LLM_TIMEOUT_MS = 3 * 60 * 1000

export async function chat(prompt) {
  const { ollamaUrl, ollamaModel } = getConfig()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS)

  try {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ model: ollamaModel, prompt, stream: false, options: { num_predict: 800 } }),
      signal:  controller.signal,
    })

    if (!res.ok) throw new Error(`Ollama generate failed: ${res.status}`)

    const data = await res.json()
    return data.response
  } finally {
    clearTimeout(timer)
  }
}

// ─── streaming ────────────────────────────────────────────────────────────────

export async function* chatStream(prompt) {
  const { ollamaUrl, ollamaModel } = getConfig()

  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ model: ollamaModel, prompt, stream: true }),
  })

  if (!res.ok) throw new Error(`Ollama stream failed: ${res.status}`)

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const chunk = JSON.parse(line)
        if (chunk.response) yield chunk.response
        if (chunk.done) return
      } catch {
        // skip malformed chunks
      }
    }
  }
}

// ─── structured output ───────────────────────────────────────────────────────

const STRICT_SUFFIX =
  '\n\nCRITICAL: Return ONLY a raw JSON object. No explanation. No markdown. No code fences. Just the JSON.'

/**
 * Call the LLM and validate output against a Zod schema.
 * Retries once with a stricter prompt on failure.
 * Returns fallback if both attempts fail.
 */
export async function chatStructured(prompt, schema, fallback) {
  // attempt 1 — normal prompt
  try {
    const raw    = await chat(prompt)
    const result = parseAndValidate(raw, schema)
    if (result.success) return result.data
    logger.warn('LLM output failed validation (attempt 1)', { error: result.error })
  } catch (err) {
    logger.warn('LLM call failed (attempt 1)', { error: err.message })
  }

  // attempt 2 — stricter format instruction
  logger.warn('Retrying LLM call with strict prompt')
  try {
    const raw    = await chat(prompt + STRICT_SUFFIX)
    const result = parseAndValidate(raw, schema)
    if (result.success) return result.data
    logger.warn('LLM output failed validation (attempt 2)', { error: result.error })
  } catch (err) {
    logger.warn('LLM call failed (attempt 2)', { error: err.message })
  }

  // fallback — session must never break
  logger.warn('Both LLM attempts failed — using fallback')
  return fallback
}

// ─── utils ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
