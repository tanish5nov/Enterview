export function HomeScreen({ onStart, onHistory }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>Enterview</p>
        <h1 style={styles.title}>AI Mock Interviewer</h1>
        <p style={styles.subtitle}>
          Practice technical interviews with an AI that asks real cross-questions,
          not a linear chatbot.
        </p>
        <button style={styles.cta} onClick={onStart}>
          Start Interview
        </button>
        <button style={styles.secondary} onClick={onHistory}>
          View History
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight:       '100vh',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    background:      '#0f0f0f',
    padding:         '24px',
  },
  card: {
    maxWidth:        '480px',
    width:           '100%',
    background:      '#1a1a1a',
    border:          '1px solid #2a2a2a',
    borderRadius:    '16px',
    padding:         '40px',
  },
  eyebrow: {
    margin:          '0 0 12px',
    color:           '#666',
    fontSize:        '13px',
    letterSpacing:   '0.08em',
    textTransform:   'uppercase',
  },
  title: {
    margin:          '0 0 16px',
    color:           '#f0f0f0',
    fontSize:        '32px',
    fontWeight:      700,
    lineHeight:      1.1,
  },
  subtitle: {
    margin:          '0 0 32px',
    color:           '#888',
    fontSize:        '15px',
    lineHeight:      1.6,
  },
  cta: {
    width:           '100%',
    padding:         '14px',
    background:      '#2563eb',
    color:           '#fff',
    border:          'none',
    borderRadius:    '10px',
    fontSize:        '16px',
    fontWeight:      600,
    cursor:          'pointer',
    marginBottom:    '12px',
  },
  secondary: {
    width:           '100%',
    padding:         '14px',
    background:      'none',
    color:           '#888',
    border:          '1px solid #333',
    borderRadius:    '10px',
    fontSize:        '15px',
    cursor:          'pointer',
  },
}
