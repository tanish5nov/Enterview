import mongoose from 'mongoose'

const turnSchema = new mongoose.Schema({
  sessionId:   { type: String, required: true, index: true },
  turnNumber:  { type: Number, required: true },
  question:    { type: String, required: true },
  answer:      { type: String, required: true },
  topic:       { type: String, default: '' },
  code:        { type: String, default: null },
  codeOutput:  { type: String, default: null },
  timestamp:   { type: Date, default: Date.now },
})

export const Turn = mongoose.model('Turn', turnSchema)
