import express from "express";
import { getConfig } from "./config.js";
import { connectToMongo } from "./db.js";
import { getHealthSnapshot } from "./health.js";
import { logger } from "./logger.js";
import { errorLogger, requestLogger } from "./request-logger.js";
import { connectToRedis } from "./redis.js";
import { authRouter } from "./routes/auth.js";

const app = express();
const config = getConfig();

app.use(express.json());
app.use(requestLogger);
app.use("/auth", authRouter);

app.get("/health", (_req, res) => {
  const healthSnapshot = getHealthSnapshot();
  const statusCode = healthSnapshot.ok ? 200 : 503;

  res.status(statusCode).json(healthSnapshot);
});

app.use(errorLogger);

async function startServer() {
  await connectToMongo(config.mongodbUri);
  await connectToRedis(config.redisUrl);

  app.listen(config.port, () => {
    logger.info("Server listening", {
      url: `http://localhost:${config.port}`,
    });
  });
}

startServer().catch((error) => {
  logger.error("Failed to start server", {
    error: error.message,
  });
  process.exit(1);
});
