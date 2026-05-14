// Mock Ollama server for testing — mimics /api/tags and /api/generate
// Run: node src/test/mock-ollama.js
// Starts on port 11435 by default

import http from 'http'

const PORT = process.env.MOCK_OLLAMA_PORT || 11435
const MODEL = 'qwen2.5:0.5b'

const RESPONSES = {
  '/api/tags': () => ({
    models: [{ name: MODEL, modified_at: new Date().toISOString(), size: 1 }],
  }),

  '/api/generate': (body) => {
    const prompt = body.prompt || ''

    // first question (no conversation yet)
    if (prompt.includes('opening question') || prompt.includes('opening interview')) {
      return {
        response: JSON.stringify({
          question: 'Can you explain the difference between an array and a linked list?',
          topic: 'Arrays & Strings',
        }),
        done: true,
      }
    }

    // roast — check BEFORE profile extraction (roast prompt also contains <resume>)
    if (prompt.includes('brutally honest')) {
      return {
        response: JSON.stringify({
          overall_impression: 'Resume shows potential but lacks depth in several key areas.',
          strengths: ['Clear project structure', 'Relevant tech stack'],
          weak_areas: ['No quantified impact', 'Missing system design experience'],
          project_feedback: [{ project: 'Portfolio', feedback: 'Generic project with no differentiation' }],
          skills_gap: ['Distributed systems', 'SQL proficiency'],
          improvement_suggestions: ['Add metrics to projects', 'Contribute to larger OSS projects'],
          verdict: 'Average resume. Work on impact statements.',
        }),
        done: true,
      }
    }

    // profile extraction (after roast check since roast also contains <resume>)
    if (prompt.includes('<resume>')) {
      return {
        response: JSON.stringify({
          name: 'Test Candidate',
          experience_level: 'fresher',
          skills: ['JavaScript', 'C++', 'React'],
          projects: [{ name: 'Portfolio', description: 'Personal website built with React' }],
          roles: ['Open source contributor'],
        }),
        done: true,
      }
    }

    // interview turn
    if (prompt.includes('<last_answer>')) {
      return {
        response: JSON.stringify({
          new_nodes: [{
            question: 'What is the time complexity of accessing an element by index in an array vs a linked list?',
            topic: 'Arrays & Strings',
            depth: 1,
          }],
          activate_node_id: null,
          context_update: {
            current_focus: 'Arrays & Strings',
            observation: 'Candidate shows basic understanding of data structure concepts.',
            covered_topic: '',
            candidate_summary: 'Solid foundational knowledge.',
          },
          session_complete: false,
        }),
        done: true,
      }
    }

    // report generation
    if (prompt.includes('post-interview evaluation') || prompt.includes('Write the post-interview')) {
      return {
        response: JSON.stringify({
          overall_score: 7,
          strengths: ['Good conceptual clarity', 'Strong communication'],
          areas_to_improve: ['Needs more practice on time complexity', 'Work on edge cases'],
          topic_scores: [{ topic: 'Arrays & Strings', score: 7 }],
          verdict: 'Solid performance. Shows good fundamentals with room to grow.',
          recommendation: 'hire',
        }),
        done: true,
      }
    }

    // fallback
    return {
      response: JSON.stringify({
        question: 'Can you elaborate on that point?',
        topic:    'General',
      }),
      done: true,
    }
  },
}

const server = http.createServer((req, res) => {
  let body = ''
  req.on('data', d => { body += d })
  req.on('end', () => {
    const handler = RESPONSES[req.url]
    if (!handler) {
      res.writeHead(404)
      return res.end(JSON.stringify({ error: 'not found' }))
    }

    let parsed = {}
    try { parsed = body ? JSON.parse(body) : {} } catch {}

    const result = handler(parsed)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
  })
})

server.listen(PORT, () => {
  console.log(`Mock Ollama running on http://localhost:${PORT}`)
})
