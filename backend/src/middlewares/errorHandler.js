const { logger } = require("../utils/logger");
const { Prisma } = require("@prisma/client");

module.exports = (err, req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    err.statusCode = 413;
    err.message = err.message || "File exceeds the maximum allowed size";
  }

  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";
  const response = {
    success: false,
    message: isProduction && statusCode >= 500 ? "Internal server error" : (err.message || "Internal server error"),
  };

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    response.message = "Database request failed";
    response.details = isProduction ? { code: err.code } : { code: err.code, meta: err.meta };
    logger.error({ err, path: req.originalUrl, method: req.method }, "Prisma error");
  } else if (err.code === "EBADCSRFTOKEN") {
    response.message = "Invalid CSRF token";
    response.details = { code: err.code };
  } else if (err.name === "UnauthorizedError" || err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    response.message = "Authentication error";
    response.details = isProduction ? undefined : { error: err.message };
  } else if (err.name === "ValidationError") {
    response.message = "Validation failed";
    response.details = err.details;
  }

  if (process.env.NODE_ENV !== "production" && err.stack) {
    response.stack = err.stack;
  }

  if (statusCode >= 500) {
    logger.error({ err, path: req.originalUrl, method: req.method }, "Unhandled error");
  } else if (statusCode >= 400) {
    logger.warn({ err, path: req.originalUrl, method: req.method }, "Handled error");
  }

  res.status(statusCode).json(response);
};
