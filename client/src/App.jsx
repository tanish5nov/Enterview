import { useState } from 'react'
import { HomeScreen }      from './screens/HomeScreen.jsx'
import { SetupScreen }     from './screens/SetupScreen.jsx'
import { InterviewScreen } from './screens/InterviewScreen.jsx'
import { ReportScreen }    from './screens/ReportScreen.jsx'
import { HistoryScreen }   from './screens/HistoryScreen.jsx'
import { apiFetch }        from './api.js'

export function App() {
  const [screen,    setScreen]    = useState('home')
  // home | setup | interview | report | history | historyDetail

  const [sessionId, setSessionId] = useState(null)
  const [subject,   setSubject]   = useState(null)
  const [report,    setReport]    = useState(null)
  const [reportType, setReportType] = useState('interview') // interview | roast

  // ── home ──────────────────────────────────────────────────────────────────

  function goSetup() {
    setScreen('setup')
  }

  function goHistory() {
    setScreen('history')
  }

  // ── setup → interview or roast ────────────────────────────────────────────

  async function handleSessionReady({ sessionId, subject: subj, isRoast }) {
    setSessionId(sessionId)
    setSubject(subj)

    if (isRoast) {
      try {
        const data = await apiFetch('/roast', {
          method: 'POST',
          body:   JSON.stringify({ sessionId }),
        })
        setReport(data.report)
        setReportType('roast')
        setScreen('report')
      } catch (e) {
        alert('Roast failed: ' + e.message)
        setScreen('setup')
      }
    } else {
      setScreen('interview')
    }
  }

  // ── interview → report ────────────────────────────────────────────────────

  function handleReport(r) {
    setReport(r)
    setReportType('interview')
    setScreen('report')
  }

  // ── history detail ────────────────────────────────────────────────────────

  async function openHistoryReport(sid) {
    try {
      const data = await apiFetch(`/sessions/${sid}`)
      setReport(data.session.report)
      setSubject(data.session.subject)
      setReportType(data.session.subject === 'Resume Roasting' ? 'roast' : 'interview')
      setScreen('historyDetail')
    } catch (e) {
      alert('Failed to load report: ' + e.message)
    }
  }

  function goHome() {
    setScreen('home')
    setSessionId(null)
    setReport(null)
    setSubject(null)
  }

  // ── render ────────────────────────────────────────────────────────────────

  switch (screen) {
    case 'setup':
      return <SetupScreen onSessionReady={handleSessionReady} />

    case 'interview':
      return (
        <InterviewScreen
          sessionId={sessionId}
          subject={subject}
          onEnd={() => { setScreen('report') }}
          onReport={handleReport}
        />
      )

    case 'report':
    case 'historyDetail':
      return (
        <ReportScreen
          report={report}
          type={reportType}
          subject={subject}
          onHome={goHome}
        />
      )

    case 'history':
      return (
        <HistoryScreen
          onBack={goHome}
          onOpenReport={openHistoryReport}
        />
      )

    default:
      return <HomeScreen onStart={goSetup} onHistory={goHistory} />
  }
}
