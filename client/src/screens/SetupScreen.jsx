import { useState, useRef } from 'react'
import { uploadFile, apiFetch } from '../api.js'

const SUBJECTS = [
  'DSA', 'OS', 'DBMS', 'CN', 'OOPs', 'OOD',
  'System Design', 'Tech Stack', 'Resume Cross Questions', 'Resume Roasting',
]

export function SetupScreen({ onSessionReady }) {
  const [step,       setStep]       = useState('resume')   // resume | confirm | subject | starting
  const [profile,    setProfile]    = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [subject,    setSubject]    = useState('')
  const [jdText,     setJdText]     = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [starting,   setStarting]   = useState(false)
  const [error,      setError]      = useState('')
  const fileRef  = useRef()
  const jdRef    = useRef()

  async function handleResumeUpload(file) {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('resume', file)
      const data = await uploadFile('/upload/resume', fd)
      setProfile(data.profile)
      setResumeText(data.resumeText)
      setStep('confirm')
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleStart() {
    if (!subject) return
    setStarting(true)
    setError('')
    try {
      let resolvedJd = jdText
      if (subject === 'Resume Roasting' && jdRef.current?.files?.[0]) {
        const fd = new FormData()
        fd.append('jd', jdRef.current.files[0])
        const data = await uploadFile('/upload/jd', fd)
        resolvedJd = data.jdText
      }

      const data = await apiFetch('/session/create', {
        method: 'POST',
        body:   JSON.stringify({ subject, profile, resumeText, jdText: resolvedJd }),
      })

      await onSessionReady({ sessionId: data.sessionId, subject, isRoast: subject === 'Resume Roasting' })
    } catch (e) {
      setError(e.message)
    } finally {
      setStarting(false)
    }
  }

  if (step === 'resume') {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={s.eyebrow}>Step 1 of 2</p>
          <h2 style={s.title}>Upload Your Resume</h2>
          <p style={s.sub}>PDF or plain text — we'll parse it to personalise the interview.</p>

          <div
            style={s.dropzone}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleResumeUpload(e.dataTransfer.files[0]) }}
          >
            {uploading
              ? <span style={s.hint}>Parsing resume…</span>
              : <><span style={s.dropIcon}>📄</span><span style={s.hint}>Click or drag to upload</span></>
            }
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            style={{ display: 'none' }}
            onChange={e => handleResumeUpload(e.target.files?.[0])}
          />

          {error && <p style={s.error}>{error}</p>}
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={s.eyebrow}>Step 1 of 2 — Confirm your details</p>
          <h2 style={s.title}>Resume uploaded</h2>
          <p style={s.sub}>Fix your name if needed — everything else is read from your resume during the interview.</p>

          <label style={s.fieldLabel}>Your name</label>
          <input
            style={s.nameInput}
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            placeholder="Full name"
          />

          {profile.skills.length > 0 && (
            <>
              <label style={{ ...s.fieldLabel, marginTop: 16 }}>Detected skills</label>
              <div style={s.tags}>
                {profile.skills.slice(0, 12).map(sk => (
                  <span key={sk} style={s.tag}>{sk}</span>
                ))}
              </div>
            </>
          )}

          <div style={s.row}>
            <button style={s.secondaryBtn} onClick={() => setStep('resume')}>Re-upload</button>
            <button
              style={{ ...s.primaryBtn, opacity: profile.name.trim() ? 1 : 0.4 }}
              disabled={!profile.name.trim()}
              onClick={() => setStep('subject')}
            >
              Looks good →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'subject') {
    return (
      <div style={s.page}>
        <div style={{ ...s.card, maxWidth: 640 }}>
          <p style={s.eyebrow}>Step 2 of 2</p>
          <h2 style={s.title}>Choose a Subject</h2>

          <div style={s.grid}>
            {SUBJECTS.map(sub => (
              <button
                key={sub}
                style={{ ...s.subjectBtn, ...(subject === sub ? s.subjectSelected : {}) }}
                onClick={() => setSubject(sub)}
              >
                {sub}
              </button>
            ))}
          </div>

          {subject === 'Resume Roasting' && (
            <div style={{ marginTop: 20 }}>
              <p style={s.sub}>Upload a JD to roast against (optional):</p>
              <input ref={jdRef} type="file" accept=".txt,.pdf" style={s.fileInput} />
              <textarea
                placeholder="Or paste the JD text here…"
                style={s.jdTextarea}
                value={jdText}
                onChange={e => setJdText(e.target.value)}
              />
            </div>
          )}

          {error && <p style={s.error}>{error}</p>}

          <div style={s.row}>
            <button style={s.secondaryBtn} onClick={() => setStep('confirm')}>← Back</button>
            <button
              style={{ ...s.primaryBtn, opacity: subject ? 1 : 0.4 }}
              disabled={!subject || starting}
              onClick={handleStart}
            >
              {starting
                ? subject === 'Resume Roasting' ? 'Roasting… (1–3 min)' : 'Starting…'
                : subject === 'Resume Roasting' ? 'Roast My Resume →' : 'Start Interview →'
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ─── styles ───────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0f0f0f', padding: 24,
  },
  card: {
    maxWidth: 480, width: '100%', background: '#1a1a1a',
    border: '1px solid #2a2a2a', borderRadius: 16, padding: 40,
  },
  eyebrow: { margin: '0 0 8px', color: '#555', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' },
  title:   { margin: '0 0 8px', color: '#f0f0f0', fontSize: 28, fontWeight: 700 },
  sub:     { margin: '0 0 24px', color: '#888', fontSize: 14, lineHeight: 1.6 },

  dropzone: {
    border: '2px dashed #333', borderRadius: 12, padding: '40px 24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    cursor: 'pointer', marginBottom: 16, transition: 'border-color 0.2s',
  },
  dropIcon: { fontSize: 32 },
  hint:     { color: '#666', fontSize: 14 },

  fieldLabel: { display: 'block', color: '#666', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  nameInput: {
    width: '100%', boxSizing: 'border-box', background: '#111', border: '1px solid #333',
    borderRadius: 8, color: '#f0f0f0', fontSize: 16, padding: '10px 14px',
    fontFamily: 'inherit', marginBottom: 8,
  },

  tags: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tag:  { background: '#1e2d4a', color: '#6b9fff', padding: '4px 10px', borderRadius: 20, fontSize: 12 },

  projectList: { margin: '0 0 24px', padding: '0 0 0 16px' },
  projectItem: { color: '#999', fontSize: 13, lineHeight: 1.8 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 24 },
  subjectBtn: {
    background: '#1a1a1a', border: '1px solid #333', color: '#bbb',
    padding: '12px 8px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
    textAlign: 'center', transition: 'all 0.15s',
  },
  subjectSelected: {
    background: '#1e2d4a', border: '1px solid #2563eb', color: '#fff',
  },

  fileInput:   { color: '#888', fontSize: 13, marginBottom: 8 },
  jdTextarea: {
    width: '100%', boxSizing: 'border-box', background: '#111', border: '1px solid #2a2a2a',
    borderRadius: 8, color: '#e0e0e0', fontSize: 13, padding: '10px 12px',
    resize: 'vertical', fontFamily: 'inherit', minHeight: 80, marginTop: 8,
  },

  row: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 },
  primaryBtn: {
    background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10,
    padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  secondaryBtn: {
    background: 'none', color: '#888', border: '1px solid #333',
    borderRadius: 10, padding: '12px 24px', fontSize: 14, cursor: 'pointer',
  },
  error: { color: '#f87171', fontSize: 13, margin: '8px 0 0' },
}
