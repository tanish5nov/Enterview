export function ReportScreen({ report, type, subject, onHome }) {
  const isRoast = type === 'roast'

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* header */}
        <div style={s.header}>
          <div>
            <p style={s.eyebrow}>{isRoast ? 'Resume Roast' : `Interview Report — ${subject}`}</p>
            <h1 style={s.title}>
              {isRoast
                ? report.verdict
                : `Score: ${report.overall_score}/10 · ${fmt(report.recommendation)}`
              }
            </h1>
          </div>
          <button style={s.homeBtn} onClick={onHome}>← Home</button>
        </div>

        {/* body */}
        {isRoast ? <RoastBody report={report} /> : <InterviewBody report={report} />}

      </div>
    </div>
  )
}

function InterviewBody({ report }) {
  return (
    <>
      <Section title="Verdict" accent="#6b9fff">
        <p style={s.verdict}>{report.verdict}</p>
      </Section>

      <div style={s.cols}>
        <Section title="Strengths" accent="#4ade80">
          <List items={report.strengths} bullet="✓" color="#4ade80" />
        </Section>
        <Section title="Areas to Improve" accent="#f87171">
          <List items={report.areas_to_improve} bullet="✗" color="#f87171" />
        </Section>
      </div>

      {report.topic_scores?.length > 0 && (
        <Section title="Topic Scores" accent="#a78bfa">
          <div style={s.scoreGrid}>
            {report.topic_scores.map(ts => (
              <div key={ts.topic} style={s.scoreCard}>
                <span style={s.scoreTopic}>{ts.topic}</span>
                <ScoreBar score={ts.score} />
                <span style={s.scoreNum}>{ts.score}/10</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

function RoastBody({ report }) {
  return (
    <>
      <Section title="First Impression" accent="#6b9fff">
        <p style={s.verdict}>{report.overall_impression}</p>
      </Section>

      <div style={s.cols}>
        <Section title="Strengths" accent="#4ade80">
          <List items={report.strengths} bullet="✓" color="#4ade80" />
        </Section>
        <Section title="Weak Areas" accent="#f87171">
          <List items={report.weak_areas} bullet="✗" color="#f87171" />
        </Section>
      </div>

      {report.project_feedback?.length > 0 && (
        <Section title="Project Feedback" accent="#fbbf24">
          {report.project_feedback.map(pf => (
            <div key={pf.project} style={s.projectFeedback}>
              <strong style={{ color: '#fbbf24' }}>{pf.project}</strong>
              <p style={s.projectText}>{pf.feedback}</p>
            </div>
          ))}
        </Section>
      )}

      <div style={s.cols}>
        {report.skills_gap?.length > 0 && (
          <Section title="Skills Gap" accent="#f87171">
            <List items={report.skills_gap} bullet="▸" color="#f87171" />
          </Section>
        )}
        {report.improvement_suggestions?.length > 0 && (
          <Section title="Suggestions" accent="#4ade80">
            <List items={report.improvement_suggestions} bullet="→" color="#4ade80" />
          </Section>
        )}
      </div>
    </>
  )
}

function Section({ title, accent, children }) {
  return (
    <div style={{ ...s.section, borderLeft: `3px solid ${accent}` }}>
      <p style={{ ...s.sectionTitle, color: accent }}>{title}</p>
      {children}
    </div>
  )
}

function List({ items, bullet, color }) {
  return (
    <ul style={s.list}>
      {(items || []).map((item, i) => (
        <li key={i} style={s.listItem}>
          <span style={{ color, marginRight: 8 }}>{bullet}</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function ScoreBar({ score }) {
  return (
    <div style={s.barTrack}>
      <div style={{ ...s.barFill, width: `${score * 10}%`, background: score >= 7 ? '#4ade80' : score >= 5 ? '#fbbf24' : '#f87171' }} />
    </div>
  )
}

function fmt(rec) {
  return { strong_hire: 'Strong Hire', hire: 'Hire', maybe: 'Maybe', no_hire: 'No Hire' }[rec] ?? rec
}

// ─── styles ───────────────────────────────────────────────────────────────────

const s = {
  page: { minHeight: '100vh', background: '#0f0f0f', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' },
  container: { maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  eyebrow: { margin: '0 0 6px', color: '#555', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' },
  title:   { margin: 0, color: '#f0f0f0', fontSize: 26, fontWeight: 700, lineHeight: 1.2 },
  homeBtn: { background: 'none', border: '1px solid #333', color: '#888', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },

  cols:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  section: { background: '#1a1a1a', borderRadius: 12, padding: '20px 20px 20px 24px', marginBottom: 16 },
  sectionTitle: { margin: '0 0 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  verdict: { margin: 0, color: '#e0e0e0', fontSize: 15, lineHeight: 1.7 },

  list:     { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 },
  listItem: { color: '#ccc', fontSize: 13, lineHeight: 1.6, display: 'flex', alignItems: 'flex-start' },

  scoreGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  scoreCard: { display: 'flex', alignItems: 'center', gap: 12 },
  scoreTopic: { color: '#bbb', fontSize: 13, minWidth: 140 },
  scoreNum:   { color: '#888', fontSize: 12, minWidth: 32 },
  barTrack: { flex: 1, height: 6, background: '#2a2a2a', borderRadius: 3, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 3, transition: 'width 0.5s ease' },

  projectFeedback: { marginBottom: 12 },
  projectText:     { margin: '4px 0 0', color: '#999', fontSize: 13, lineHeight: 1.6 },
}
