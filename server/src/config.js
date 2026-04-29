import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const projectRootPath = path.resolve(currentDirPath, "..", "..");

dotenv.config({
  path: path.join(projectRootPath, ".env"),
  quiet: true,
});

const requiredEnvVars = [
  "MONGODB_URI",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "OLLAMA_BASE_URL",
];

export function getConfig() {
  const missing = requiredEnvVars.filter((name) => {
    const value = process.env[name];
    return typeof value !== "string" || value.trim() === "";
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `Populate AIEngineerInterviewer/.env using AIEngineerInterviewer/.env.example.`,
    );
  }

  return {
    port: Number(process.env.PORT || 4000),
    mongodbUri: process.env.MONGODB_URI,
    redisUrl: process.env.REDIS_URL,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
  };
}
