const prisma = require("../lib/prisma");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    req.user = null;
    return next();
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

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError(401, "Authentication token has expired"));
    }

    return next(new AppError(401, "Invalid authentication token"));
  }
};
