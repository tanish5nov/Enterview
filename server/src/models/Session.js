import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  sessionId:        { type: String, required: true, unique: true, index: true },
  subject:          { type: String, required: true },
  status:           { type: String, enum: ['active', 'completed'], default: 'active' },
  candidateProfile: { type: mongoose.Schema.Types.Mixed },
  treeSnapshot:     { type: mongoose.Schema.Types.Mixed, default: null }, // persisted after each turn
  report:           { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt:        { type: Date, default: Date.now },
  completedAt:      { type: Date, default: null },
})

export const Session = mongoose.model('Session', sessionSchema)
