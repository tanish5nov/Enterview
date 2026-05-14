import { logger } from './logger.js'

export function requestLogger(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      path:   req.path,
      status: res.statusCode,
      ms:     Date.now() - start,
    })
  })
  next()
}
