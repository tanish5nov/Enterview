import { useState, useEffect } from 'react'
import { apiFetch } from '../api.js'

export function HistoryScreen({ onBack, onOpenReport }) {
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    apiFetch('/sessions')
      .then(data => setSessions(data.sessions || []))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.title}>Interview History</h1>
          <button style={s.backBtn} onClick={onBack}>← Home</button>
        </div>

        {loading && <p style={s.hint}>Loading…</p>}
        {error   && <p style={s.error}>{error}</p>}
        {!loading && !error && sessions.length === 0 && (
          <p style={s.hint}>No interviews yet. Start one from the home screen.</p>
        )}

        <div style={s.list}>
          {sessions.map(sess => (
            <div
              key={sess.sessionId}
              style={s.card}
              onClick={() => onOpenReport && onOpenReport(sess.sessionId)}
            >
              <div style={s.cardLeft}>
                <span style={s.subject}>{sess.subject}</span>
                <span style={s.date}>
                  {new Date(sess.createdAt).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>
              <div style={s.cardRight}>
                {sess.status === 'completed'
                  ? <>
                      {sess.report?.overall_score !== undefined && (
                        <span style={s.score}>{sess.report.overall_score}/10</span>
                      )}
                      <span style={s.verdict}>
                        {sess.report?.verdict || sess.report?.overall_impression || '—'}
                      </span>
                    </>
                  : <span style={s.active}>In progress</span>
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  page:      { minHeight: '100vh', background: '#0f0f0f', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' },
  container: { maxWidth: 720, margin: '0 auto' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title:     { margin: 0, color: '#f0f0f0', fontSize: 28, fontWeight: 700 },
  backBtn:   { background: 'none', border: '1px solid #333', color: '#888', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  hint:      { color: '#555', fontSize: 14 },
  error:     { color: '#f87171', fontSize: 14 },

  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12,
    padding: '16px 20px', cursor: 'pointer', display: 'flex',
    justifyContent: 'space-between', alignItems: 'flex-start',
    transition: 'border-color 0.15s',
  },
  cardLeft:  { display: 'flex', flexDirection: 'column', gap: 4 },
  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, maxWidth: '55%' },
  subject:   { color: '#f0f0f0', fontSize: 15, fontWeight: 600 },
  date:      { color: '#555', fontSize: 12 },
  score:     { color: '#6b9fff', fontSize: 18, fontWeight: 700 },
  verdict:   { color: '#888', fontSize: 12, textAlign: 'right', lineHeight: 1.4 },
  active:    { color: '#fbbf24', fontSize: 12 },
}
