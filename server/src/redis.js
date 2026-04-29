import { createClient } from "redis";

let redisClient;

export async function connectToRedis(redisUrl) {
  if (!redisClient) {
    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on("error", (error) => {
      console.error("Redis client error:", error.message);
    });
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}

export function getRedisStatus() {
  if (!redisClient) {
    return "disconnected";
  }

  if (redisClient.isReady) {
    return "connected";
  }

  if (redisClient.isOpen) {
    return "connecting";
  }

  return "disconnected";
}
