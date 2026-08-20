const AppError = require("../utils/AppError");

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Unauthenticated requests should receive 401
    if (!req.user) {
      return next(new AppError(401, "Authentication required"));
    }

    // Missing role information on an authenticated user is treated as USER by default
    const role = req.user.role || "USER";

    if (!allowedRoles.includes(role)) {
      return next(new AppError(403, "Forbidden: insufficient permissions"));
    }

    return next();
  };
};

module.exports = {
  authorizeRoles,
};
