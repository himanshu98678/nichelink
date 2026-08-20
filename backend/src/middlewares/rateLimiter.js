const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { createClient } = require("redis");
const { env } = require("../config/env");

let redisClient;
let redisConnection;

const getRedisClient = () => {
  if (!env.REDIS_URL) { return null; }
  if (!redisClient) {
    redisClient = createClient({ url: env.REDIS_URL });
    redisClient.on("error", (error) => console.error("Rate-limit Redis error:", error.message));
    redisConnection = redisClient.connect().catch((error) => {
      console.error("Rate-limit Redis connection failed:", error.message);
      throw error;
    });
  }
  return redisClient;
};

const getStore = () => {
  if (!env.REDIS_URL) { return undefined; }
  getRedisClient();
  return new RedisStore({
    prefix: "niche-link:rate-limit:",
    sendCommand: async (...command) => {
      await redisConnection;
      return redisClient.sendCommand(command);
    },
  });
};

const getEnvLimit = (key, fallback) => {
  const raw = process.env[key] ?? env[key] ?? fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

const createLimiter = ({ max, message, windowMs = getEnvLimit("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000) }) =>
  rateLimit({
    windowMs,
    max: typeof max === "function" ? max : Number(max || 250),
    store: getStore(),
    passOnStoreError: true,
    standardHeaders: true,
    legacyHeaders: false,
    message,
  });

const generalLimiter = createLimiter({
  max: () => getEnvLimit("RATE_LIMIT_MAX", 250),
  message: { success: false, message: "Too many requests, please try again later" },
});

const authLimiter = createLimiter({
  max: () => getEnvLimit("AUTH_RATE_LIMIT_MAX", 40),
  message: { success: false, message: "Too many authentication attempts, please try again later" },
});

const emailLimiter = createLimiter({
  max: () => getEnvLimit("EMAIL_RATE_LIMIT_MAX", 10),
  message: { success: false, message: "Too many email requests, please try again later" },
});

const verificationLimiter = createLimiter({
  max: () => getEnvLimit("EMAIL_RATE_LIMIT_MAX", 10),
  message: { success: false, message: "Too many email verification requests, please try again later" },
});

const forgotPasswordLimiter = createLimiter({
  max: () => getEnvLimit("EMAIL_RATE_LIMIT_MAX", 10),
  message: { success: false, message: "Too many password reset requests, please try again later" },
});

const resetPasswordLimiter = createLimiter({
  max: () => getEnvLimit("EMAIL_RATE_LIMIT_MAX", 10),
  message: { success: false, message: "Too many password reset requests, please try again later" },
});

const uploadLimiter = rateLimit({
  windowMs: getEnvLimit("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  max: 60,
  store: getStore(),
  passOnStoreError: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many upload requests, please try again later" },
});

const messageLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 15,
  store: getStore(),
  passOnStoreError: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many messages, please try again later" },
});

module.exports = {
  generalLimiter,
  authLimiter,
  emailLimiter,
  verificationLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  uploadLimiter,
  messageLimiter,
  getRedisClient,
  getRedisConnection: () => redisConnection,
};
