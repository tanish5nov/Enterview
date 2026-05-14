// ─── JSON extractor ──────────────────────────────────────────────────────────
// LLMs often wrap JSON in markdown or add prose. Try several extraction strategies.

function extractJson(text) {
  const t = text.trim()

  // 1. bare JSON
  try { return JSON.parse(t) } catch {}

  // 2. ```json ... ``` block
  const jsonBlock = t.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonBlock) {
    try { return JSON.parse(jsonBlock[1]) } catch {}
  }

  // 3. ``` ... ``` block (no language tag)
  const codeBlock = t.match(/```\s*([\s\S]*?)\s*```/)
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1]) } catch {}
  }

  // 4. first { … last } in the string
  const start = t.indexOf('{')
  const end   = t.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(t.slice(start, end + 1)) } catch {}
  }

  return null
}

// ─── main export ─────────────────────────────────────────────────────────────

/**
 * Parse raw LLM text and validate against a Zod schema.
 * Returns { success: true, data } or { success: false, error }.
 */
export function parseAndValidate(rawText, schema) {
  const parsed = extractJson(rawText)

  if (parsed === null) {
    return { success: false, error: 'Could not extract JSON from LLM response' }
  }

  const result = schema.safeParse(parsed)

  if (!result.success) {
    return {
      success: false,
      error:   result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
    }
  }

  return { success: true, data: result.data }
}
