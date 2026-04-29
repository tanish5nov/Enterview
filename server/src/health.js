import { getMongoStatus } from "./db.js";
import { getRedisStatus } from "./redis.js";

function isSubsystemHealthy(status) {
  return status === "connected";
}

export function getHealthSnapshot() {
  const mongoStatus = getMongoStatus();
  const redisStatus = getRedisStatus();
  const ok =
    isSubsystemHealthy(mongoStatus) && isSubsystemHealthy(redisStatus);

  return {
    ok,
    status: ok ? "healthy" : "degraded",
    service: "ai-swe-mock-interviewer-server",
    server: {
      status: "alive",
    },
    mongo: {
      status: mongoStatus,
    },
    redis: {
      status: redisStatus,
    },
  };
}
