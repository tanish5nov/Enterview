const sessions = new Map()

export function createSession(sessionId, { subject, profile, resumeText, jdText }) {
  sessions.set(sessionId, {
    sessionId,
    subject,
    profile,
    resumeText:  resumeText  || '',
    jdText:      jdText      || null,
    tree:        null,
    turns:       0,
  })
}

export function getSession(sessionId) {
  return sessions.get(sessionId) || null
}

export function setTree(sessionId, tree) {
  const s = sessions.get(sessionId)
  if (s) s.tree = tree
}

export function incrementTurns(sessionId) {
  const s = sessions.get(sessionId)
  if (s) s.turns++
}

export function deleteSession(sessionId) {
  sessions.delete(sessionId)
}
