// Client → Server
export const CLIENT_EVENTS = {
  SESSION_START:  'session:start',
  ANSWER_SUBMIT:  'answer:submit',
  SESSION_END:    'session:end',
}

// Server → Client
export const SERVER_EVENTS = {
  QUESTION_TOKEN:    'question:token',
  QUESTION_COMPLETE: 'question:complete',
  TREE_UPDATE:       'tree:update',
  SESSION_ERROR:     'session:error',
  REPORT_READY:      'report:ready',
}
