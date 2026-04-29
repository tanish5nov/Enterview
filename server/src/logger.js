function formatMeta(meta) {
  if (!meta || Object.keys(meta).length === 0) {
    return "";
  }

  return ` ${JSON.stringify(meta)}`;
}

function writeLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${level.toUpperCase()} ${message}${formatMeta(meta)}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info(message, meta) {
    writeLog("info", message, meta);
  },
  warn(message, meta) {
    writeLog("warn", message, meta);
  },
  error(message, meta) {
    writeLog("error", message, meta);
  },
};
