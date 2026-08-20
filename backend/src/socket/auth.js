const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

module.exports = async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication token missing"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, username: true, email: true },
    });

    if (!user) {
      return next(new Error("Invalid authentication token"));
    }

    socket.user = user;
    return next();
  } catch {
    return next(new Error("Invalid authentication token"));
  }
};
