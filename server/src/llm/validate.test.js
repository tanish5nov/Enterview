// Phase 2.7 — manual validation test for parseAndValidate
// Run: node src/llm/validate.test.js

import { z } from 'zod'
import { parseAndValidate } from './validate.js'

const schema = z.object({
  score:   z.number().min(0).max(10),
  comment: z.string(),
})

const fallback = { score: 0, comment: 'fallback' }

function test(label, input, expectSuccess) {
  const result = parseAndValidate(input, schema)
  const ok = result.success === expectSuccess
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}`)
  if (!ok) console.error('  got:', result)
}

// 1. bare JSON
test('bare JSON',          '{"score":7,"comment":"good"}',           true)
// 2. json block
test('```json block',      '```json\n{"score":5,"comment":"ok"}\n```', true)
// 3. plain code block
test('``` block',          '```\n{"score":3,"comment":"meh"}\n```',   true)
// 4. prose with embedded JSON
test('prose + embedded',   'Here is the result: {"score":8,"comment":"great"} done.', true)
// 5. broken JSON
test('broken JSON',        'not json at all',                         false)
// 6. wrong shape
test('wrong shape',        '{"value":5}',                             false)
// 7. score out of range
test('score out of range', '{"score":99,"comment":"x"}',              false)
