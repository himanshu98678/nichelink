const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

const assignRoleToUser = async (targetUserId, role, actorUserId) => {
  if (!targetUserId || !role) {
    throw new AppError(400, "Target user and role are required");
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Ensure actor exists and has sufficient privileges
  const actor = await prisma.user.findUnique({ where: { id: actorUserId } });
  if (!actor) {throw new AppError(401, "Actor not found or unauthenticated");}

  const actorRole = actor.role || "USER";

  // Only ADMIN or SUPER_ADMIN can assign roles
  if (!["ADMIN", "SUPER_ADMIN"].includes(actorRole)) {
    throw new AppError(403, "Forbidden: insufficient permissions to assign roles");
  }

  // Cannot modify an existing SUPER_ADMIN unless actor is that SUPER_ADMIN
  if (user.role === "SUPER_ADMIN" && user.id !== actorUserId) {
    throw new AppError(403, "Cannot modify a SUPER_ADMIN role");
  }

  // ADMINs cannot grant SUPER_ADMIN to others
  if (role === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN") {
    throw new AppError(403, "Only SUPER_ADMIN can grant SUPER_ADMIN role");
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { role },
  });
};

const getUserRoles = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

module.exports = {
  assignRoleToUser,
  getUserRoles,
};
