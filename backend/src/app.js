const { env } = require("./config/env");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require('compression');
const csurf = require("csurf");
const cookieParser = require("cookie-parser");
const path = require("path");
const routes = require("./routes");
const notFoundHandler = require("./middlewares/notFoundHandler");
const errorHandler = require("./middlewares/errorHandler");
const { generalLimiter, authLimiter, verificationLimiter, forgotPasswordLimiter, resetPasswordLimiter, emailLimiter } = require("./middlewares/rateLimiter");
const requestLogger = require("./middlewares/requestLogger");
const sanitizeRequest = require("./middlewares/sanitizeRequest");
const securityHeaders = require("./middlewares/securityHeaders");
const metricsMiddleware = require("./middlewares/metricsMiddleware");
const prisma = require("./lib/prisma");
const swaggerUi = require("swagger-ui-express");
const swaggerDoc = require("./swagger");

const app = express();

app.disable("x-powered-by");
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(securityHeaders);
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: env.CORS_ALLOW_CREDENTIALS,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "X-CSRF-Token"],
    optionsSuccessStatus: 204,
  }),
);
app.use(compression());
app.use(requestLogger);
app.use(express.json({
  limit: env.REQUEST_SIZE_LIMIT,
  verify: (req, res, buffer) => {
    if (req.originalUrl === "/api/billing/webhook") {
      req.rawBody = Buffer.from(buffer);
    }
  },
}));
app.use(express.urlencoded({ extended: false, limit: env.REQUEST_SIZE_LIMIT }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(sanitizeRequest);
app.use(metricsMiddleware);

if (env.CSRF_ENABLED) {
  app.use(csurf({ cookie: { httpOnly: false, secure: env.NODE_ENV === "production", sameSite: "strict", key: env.CSRF_COOKIE_NAME } }));
  app.use((req, res, next) => {
    res.cookie(env.CSRF_COOKIE_NAME, req.csrfToken(), {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
    });
    next();
  });
}

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads", "public"), {
    dotfiles: "deny",
    index: false,
  }),
);
app.use("/api", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/verify-email", verificationLimiter);
app.use("/api/auth/forgot-password", forgotPasswordLimiter);
app.use("/api/auth/reset-password", resetPasswordLimiter);
app.use("/api/auth/refresh-token", authLimiter);
app.use("/api/auth/logout", authLimiter);
app.use("/api/email", emailLimiter);

app.get("/", (req, res) => {
  res.json({ success: true, message: "NicheLink Backend API is running 🚀" });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use("/api", routes);

const getDependencyStatus = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok" };
  } catch {
    return { status: "error" };
  }
};

app.get("/health", async (req, res) => {
  const memoryUsage = process.memoryUsage();
  const database = await getDependencyStatus();
  const healthy = database.status === "ok";
  return res.status(healthy ? 200 : 503).json({
    success: healthy,
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
    database,
  });
});
app.get("/ready", async (req, res) => {
  const database = await getDependencyStatus();
  const ready = database.status === "ok";
  return res.status(ready ? 200 : 503).json({ success: ready, uptime: process.uptime(), status: ready ? "ready" : "not_ready", database });
});
app.get("/live", (req, res) => {
  res.json({ success: true, uptime: process.uptime(), status: "live" });
});
app.get("/metrics", async (req, res) => {
  const { getMetrics } = require("./utils/metrics");
  res.set("Content-Type", "text/plain");
  res.send(await getMetrics());
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
