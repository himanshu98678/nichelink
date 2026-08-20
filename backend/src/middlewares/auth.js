const prisma = require("../lib/prisma");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication token missing"));
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return next(new AppError(401, "Authentication token missing"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, name: true, email: true },
    });

    if (!user) {
      return next(new AppError(401, "Invalid authentication token"));
    }

    // Ensure role is present for downstream authorization checks
    if (!user.role) { user.role = "USER"; }
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError(401, "Authentication token has expired"));
    }

    return next(new AppError(401, "Invalid authentication token"));
  }
};