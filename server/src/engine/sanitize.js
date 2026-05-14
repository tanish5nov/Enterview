const MAX_LENGTHS = {
  answer: 2000,
  code:   8000,
  resume: 5000,
  jd:     3000,
}

// strip XML tags that could poison prompt structure
const INJECTION_RE = /<\/?(system|prompt|instruction|user|assistant|context|tree|answer|code|resume|jd|subject|candidate)[^>]*>/gi

export function sanitize(text, type = 'answer') {
  if (typeof text !== 'string') return ''
  const limit = MAX_LENGTHS[type] ?? 2000
  return text
    .replace(INJECTION_RE, '')
    .slice(0, limit)
    .trim()
}
