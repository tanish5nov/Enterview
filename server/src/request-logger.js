import { logger } from "./logger.js";

export function requestLogger(req, res, next) {
  const startTime = Date.now();

  res.on("finish", () => {
    logger.info("HTTP request completed", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startTime,
    });
  });

  next();
}

export function errorLogger(error, req, _res, next) {
  logger.error("HTTP request failed", {
    method: req.method,
    path: req.originalUrl,
    error: error.message,
  });

  next(error);
}
