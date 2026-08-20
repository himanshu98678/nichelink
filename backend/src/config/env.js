const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const Joi = require("joi");

const backendRoot = path.resolve(__dirname, "..", "..");
const envFilename = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
const envPath = path.resolve(backendRoot, envFilename);
const defaultEnvPath = path.resolve(backendRoot, ".env");

if (process.env.NODE_ENV === "test" && !fs.existsSync(envPath)) {
  dotenv.config({ path: defaultEnvPath });
} else {
  dotenv.config({ path: envPath });
}

const schema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
  PORT: Joi.number().port().default(5000),
  DATABASE_URL: Joi.string().uri().required(),
  DIRECT_URL: Joi.string().uri().optional(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default("7d"),
  APP_URL: Joi.string().uri().default("http://localhost:5000"),
  CORS_ORIGINS: Joi.string().default("http://localhost:5000"),
  CORS_ALLOW_CREDENTIALS: Joi.boolean().truthy("true").falsy("false").default(false),
  LOG_LEVEL: Joi.string().valid("fatal", "error", "warn", "info", "debug", "trace").default("info"),
  REQUEST_SIZE_LIMIT: Joi.string().default("10kb"),
  COOKIE_SECRET: Joi.string().min(16).default("nichelink_cookie_secret"),
  CSRF_ENABLED: Joi.boolean().truthy("true").falsy("false").default(false),
  CSRF_COOKIE_NAME: Joi.string().default("XSRF-TOKEN"),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().default(900000),
  RATE_LIMIT_MAX: Joi.number().integer().default(250),
  AUTH_RATE_LIMIT_MAX: Joi.number().integer().default(40),
  EMAIL_RATE_LIMIT_MAX: Joi.number().integer().default(10),
  REDIS_URL: Joi.string().uri().optional().allow(""),
  OTP_RESEND_COOLDOWN_SECONDS: Joi.number().integer().min(0).default(30),
  EMAIL_MAX_RETRIES: Joi.number().integer().default(3),
  UPLOAD_MAX_FILE_SIZE: Joi.number().integer().default(52428800),
  EMAIL_FROM: Joi.string().email({ tlds: { allow: false } }).default("no-reply@nichelink.local"),
  SMTP_HOST: Joi.string().optional().allow(""),
  SMTP_PORT: Joi.number().integer().optional(),
  SMTP_SECURE: Joi.boolean().truthy("true").falsy("false").default(false),
  SMTP_USER: Joi.string().optional().allow(""),
  SMTP_PASS: Joi.string().optional().allow(""),
  CLOUDINARY_CLOUD_NAME: Joi.string().optional().allow(""),
  CLOUDINARY_API_KEY: Joi.string().optional().allow(""),
  CLOUDINARY_API_SECRET: Joi.string().optional().allow(""),
  STRIPE_SECRET_KEY: Joi.string().optional().allow(""),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(""),
  STRIPE_PRICE_PRO: Joi.string().optional().allow(""),
  STRIPE_SUCCESS_URL: Joi.string().uri().optional().allow(""),
  STRIPE_CANCEL_URL: Joi.string().uri().optional().allow(""),
  EMAIL_QUEUE_ENABLED: Joi.boolean().truthy("true").falsy("false").default(false),
}).unknown();

const { value: env, error } = schema.validate(process.env, {
  abortEarly: false,
  convert: true,
});

if (error) {
  console.error("Environment validation error:", error.message);
  throw new Error(`Invalid environment configuration: ${error.message}`);
}

if (env.NODE_ENV === "production") {
  const insecureDefaults = ["nichelink_cookie_secret", "change-me", "secret"];
  if (!env.COOKIE_SECRET || insecureDefaults.includes(env.COOKIE_SECRET.toLowerCase())) {
    throw new Error("COOKIE_SECRET must be explicitly configured in production");
  }
}

const parseOrigins = (origins) => origins.split(",").map((origin) => origin.trim()).filter(Boolean);

module.exports = {
  env,
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  DATABASE_URL: env.DATABASE_URL,
  DIRECT_URL: env.DIRECT_URL,
  JWT_SECRET: env.JWT_SECRET,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
  APP_URL: env.APP_URL,
  CORS_ORIGINS: parseOrigins(env.CORS_ORIGINS),
  CORS_ALLOW_CREDENTIALS: env.CORS_ALLOW_CREDENTIALS,
  LOG_LEVEL: env.LOG_LEVEL,
  REQUEST_SIZE_LIMIT: env.REQUEST_SIZE_LIMIT,
  COOKIE_SECRET: env.COOKIE_SECRET,
  CSRF_ENABLED: env.CSRF_ENABLED,
  CSRF_COOKIE_NAME: env.CSRF_COOKIE_NAME,
  RATE_LIMIT_WINDOW_MS: env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: env.RATE_LIMIT_MAX,
  AUTH_RATE_LIMIT_MAX: env.AUTH_RATE_LIMIT_MAX,
  EMAIL_RATE_LIMIT_MAX: env.EMAIL_RATE_LIMIT_MAX,
  REDIS_URL: env.REDIS_URL,
  OTP_RESEND_COOLDOWN_SECONDS: env.OTP_RESEND_COOLDOWN_SECONDS,
  EMAIL_MAX_RETRIES: env.EMAIL_MAX_RETRIES,
  EMAIL_FROM: env.EMAIL_FROM,
  UPLOAD_MAX_FILE_SIZE: env.UPLOAD_MAX_FILE_SIZE,
  SMTP_HOST: env.SMTP_HOST,
  SMTP_PORT: env.SMTP_PORT,
  SMTP_SECURE: env.SMTP_SECURE,
  SMTP_USER: env.SMTP_USER,
  SMTP_PASS: env.SMTP_PASS,
  CLOUDINARY_CLOUD_NAME: env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET,
  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_PRO: env.STRIPE_PRICE_PRO,
  STRIPE_SUCCESS_URL: env.STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL: env.STRIPE_CANCEL_URL,
  EMAIL_QUEUE_ENABLED: env.EMAIL_QUEUE_ENABLED,
};
