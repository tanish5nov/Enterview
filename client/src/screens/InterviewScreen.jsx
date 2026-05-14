import { useState, useRef, useEffect, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { connectWS, sendWS, onWS, offWS, disconnectWS } from '../ws.js'
import { speak } from '../tts.js'

const SERVER_EVENTS = {
  QUESTION_COMPLETE: 'question:complete',
  TREE_UPDATE:       'tree:update',
  SESSION_ERROR:     'session:error',
  REPORT_READY:      'report:ready',
}

export function InterviewScreen({ sessionId, subject, onEnd, onReport }) {
  const [messages,    setMessages]    = useState([])
  const [answer,      setAnswer]      = useState('')
  const [includeCode, setIncludeCode] = useState(false)
  const [code,        setCode]        = useState(
    '// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n'
  )
  const [output,      setOutput]      = useState('')
  const [isRunning,   setIsRunning]   = useState(false)
  const [isThinking,  setIsThinking]  = useState(false)
  const [fatalError,  setFatalError]  = useState('')
  const [lastOutput,  setLastOutput]  = useState('')
  const messagesEndRef = useRef(null)
  const codeRef        = useRef(code)

  useEffect(() => { codeRef.current = code }, [code])

  // ── WebSocket setup ────────────────────────────────────────────────────────

  const handleQuestion = useCallback(({ question }) => {
    setIsThinking(false)
    setMessages(prev => [...prev, { role: 'interviewer', text: question }])
    speak(question)
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleError = useCallback(({ message }) => {
    setIsThinking(false)
    if (message.includes('not found') || message.includes('expired')) {
      setFatalError(message)
    } else {
      setMessages(prev => [...prev, { role: 'system', text: `Error: ${message}` }])
    }
  }, [])

  const handleReport = useCallback(({ report }) => {
    setIsThinking(false)
    onReport(report)
  }, [onReport])

  useEffect(() => {
    let mounted = true

    connectWS().then(() => {
      if (!mounted) return
      onWS(SERVER_EVENTS.QUESTION_COMPLETE, handleQuestion)
      onWS(SERVER_EVENTS.SESSION_ERROR,     handleError)
      onWS(SERVER_EVENTS.REPORT_READY,      handleReport)

      setIsThinking(true)
      sendWS('session:start', {}, sessionId)
    }).catch(() => {
      // guard: if cleanup already ran (StrictMode fake mount) don't show error —
      // the real mount's connectWS() will immediately follow and succeed
      if (!mounted) return
      setMessages([{ role: 'system', text: 'Could not connect to server. Check the backend is running.' }])
    })

    return () => {
      mounted = false
      offWS(SERVER_EVENTS.QUESTION_COMPLETE, handleQuestion)
      offWS(SERVER_EVENTS.SESSION_ERROR,     handleError)
      offWS(SERVER_EVENTS.REPORT_READY,      handleReport)
      disconnectWS()
    }
  }, [sessionId, handleQuestion, handleError, handleReport])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── submit answer ──────────────────────────────────────────────────────────

  function handleSubmit(e) {
    e.preventDefault()
    if (!answer.trim() || isThinking) return

    const text = answer.trim()
    setMessages(prev => [...prev, { role: 'candidate', text }])
    setAnswer('')
    setIsThinking(true)

    sendWS('answer:submit', {
      answer:      text,
      includeCode: includeCode,
      code:        includeCode ? codeRef.current : null,
      codeOutput:  includeCode ? lastOutput      : null,
    }, sessionId)
  }

  // ── end session ────────────────────────────────────────────────────────────

  function handleEnd() {
    setIsThinking(true)
    sendWS('session:end', {}, sessionId)
  }

  // ── run C++ ────────────────────────────────────────────────────────────────

  async function handleRun() {
    setIsRunning(true)
    setOutput('')
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'
      const res  = await fetch(`${BASE}/code/run`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: codeRef.current, stdin: '', sessionId }),
      })
      const data = await res.json()

      if (data.error) {
        setOutput(data.error)
        setLastOutput(data.error)
        return
      }

      const out = data.compilationError
        ? `Compilation error:\n${data.compilationError}`
        : data.timedOut
        ? 'Timed out (5s limit).'
        : data.stderr
        ? `stderr:\n${data.stderr}`
        : data.stdout || '(no output)'

      setOutput(out)
      setLastOutput(out)
    } catch {
      setOutput('Failed to reach code runner.')
    } finally {
      setIsRunning(false)
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  if (fatalError) {
    return (
      <div style={s.errorPage}>
        <div style={s.errorCard}>
          <p style={s.errorTitle}>Session Unavailable</p>
          <p style={s.errorMsg}>{fatalError}</p>
          <button style={s.errorBtn} onClick={onEnd}>← Back to Home</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>

      {/* ── chat panel ───────────────────────────────────────────────────── */}
      <div style={s.chatPanel}>
        <div style={s.chatHeader}>
          <div>
            <span style={s.label}>Interview</span>
            <span style={{ ...s.label, marginLeft: 12, color: '#3b82f6' }}>{subject}</span>
          </div>
          <button style={s.endBtn} onClick={handleEnd} disabled={isThinking}>End</button>
        </div>

        <div style={s.messages}>
          {messages.map((m, i) => (
            <div key={i} style={
              m.role === 'interviewer' ? s.interviewerMsg
                : m.role === 'candidate' ? s.candidateMsg
                : s.systemMsg
            }>
              <span style={s.msgRole}>
                {m.role === 'interviewer' ? 'Interviewer' : m.role === 'candidate' ? 'You' : ''}
              </span>
              <p style={s.msgText}>{m.text}</p>
            </div>
          ))}

          {isThinking && (
            <div style={s.interviewerMsg}>
              <span style={s.msgRole}>Interviewer</span>
              <p style={{ ...s.msgText, color: '#555' }}>
                <span style={s.dot} />
                <span style={{ ...s.dot, animationDelay: '0.2s' }} />
                <span style={{ ...s.dot, animationDelay: '0.4s' }} />
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} style={s.inputArea}>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) }
            }}
            placeholder="Type your answer… (Enter to submit, Shift+Enter for newline)"
            style={s.textarea}
            rows={3}
            disabled={isThinking}
          />
          <div style={s.inputFooter}>
            <label style={s.checkLabel}>
              <input
                type="checkbox"
                checked={includeCode}
                onChange={e => setIncludeCode(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Include code
            </label>
            <button type="submit" disabled={!answer.trim() || isThinking} style={s.submitBtn}>
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* ── IDE panel ────────────────────────────────────────────────────── */}
      <div style={s.idePanel}>
        <div style={s.ideHeader}>
          <span style={s.label}>IDE — C++</span>
          <button onClick={handleRun} disabled={isRunning} style={s.runBtn}>
            {isRunning ? 'Running…' : '▶ Run'}
          </button>
        </div>

        <div style={s.editorWrapper}>
          <Editor
            height="100%"
            defaultLanguage="cpp"
            value={code}
            onChange={val => setCode(val || '')}
            theme="vs-dark"
            options={{
              fontSize:             14,
              minimap:              { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap:             'on',
            }}
          />
        </div>

        <div style={s.outputBox}>
          <pre style={s.outputText}>{output || 'Output will appear here after running.'}</pre>
        </div>
      </div>
    </div>
  )
}

// ─── styles ───────────────────────────────────────────────────────────────────

const s = {
  page: { display: 'flex', height: '100vh', background: '#0f0f0f', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' },

  chatPanel:  { width: '45%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e1e1e' },
  chatHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #1e1e1e' },
  label:      { color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' },
  endBtn:     { background: 'none', border: '1px solid #333', color: '#888', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },

  messages: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  interviewerMsg: { alignSelf: 'flex-start', maxWidth: '85%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 14px' },
  candidateMsg:   { alignSelf: 'flex-end',   maxWidth: '85%', background: '#1e2d4a', border: '1px solid #2a3f6a', borderRadius: 10, padding: '12px 14px' },
  systemMsg:      { alignSelf: 'center', color: '#555', fontSize: 12, fontStyle: 'italic' },
  msgRole: { display: 'block', fontSize: 11, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' },
  msgText: { margin: 0, color: '#e0e0e0', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', display: 'flex', gap: 4, alignItems: 'center' },

  dot: {
    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
    background: '#555', animation: 'pulse 1s ease-in-out infinite',
  },

  inputArea:   { padding: '12px 16px', borderTop: '1px solid #1e1e1e' },
  textarea: {
    width: '100%', boxSizing: 'border-box', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 8, color: '#e0e0e0', fontSize: 14, padding: '10px 12px',
    resize: 'none', fontFamily: 'inherit', lineHeight: 1.5,
  },
  inputFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  checkLabel:  { color: '#666', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  submitBtn:   { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  idePanel:     { flex: 1, display: 'flex', flexDirection: 'column' },
  ideHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #1e1e1e' },
  runBtn:       { background: '#166534', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  editorWrapper:{ flex: 1, overflow: 'hidden' },
  outputBox:    { height: 180, borderTop: '1px solid #1e1e1e', background: '#0a0a0a', overflowY: 'auto', padding: '10px 14px' },
  outputText:   { margin: 0, color: '#7ec8a0', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.5, whiteSpace: 'pre-wrap' },

  errorPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f' },
  errorCard: { maxWidth: 420, background: '#1a1a1a', border: '1px solid #3f1a1a', borderRadius: 16, padding: 40, textAlign: 'center' },
  errorTitle: { margin: '0 0 12px', color: '#f87171', fontSize: 18, fontWeight: 700 },
  errorMsg:   { margin: '0 0 28px', color: '#888', fontSize: 14, lineHeight: 1.6 },
  errorBtn:   { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
