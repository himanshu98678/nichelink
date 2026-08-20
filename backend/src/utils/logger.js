const pino = require("pino");

const level = process.env.LOG_LEVEL || "info";
const pretty = process.env.NODE_ENV !== "production";

const logger = pino({
  level,
  transport: pretty
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: { pid: false, env: process.env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
});

const authLogger = logger.child({ subsystem: "auth" });
const adminLogger = logger.child({ subsystem: "admin" });
const auditLogger = logger.child({ subsystem: "audit" });

module.exports = { logger, authLogger, adminLogger, auditLogger };
