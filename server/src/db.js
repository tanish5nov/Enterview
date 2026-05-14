import mongoose from 'mongoose'
import { logger } from './logger.js'
import { setMongoStatus } from './health.js'

export async function connectToMongo(uri) {
  try {
    await mongoose.connect(uri)
    setMongoStatus(true)
    logger.info('MongoDB connected')
  } catch (err) {
    setMongoStatus(false)
    logger.error('MongoDB connection failed', { error: err.message })
    throw err
  }
}
