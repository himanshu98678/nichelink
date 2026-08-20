const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const AppError = require("../utils/AppError");

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const passwordStrengthPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const validatePasswordStrength = (password) => {
  if (!password || typeof password !== "string") {
    throw new AppError(400, "Password is required");
  }

  if (!passwordStrengthPattern.test(password.trim())) {
    throw new AppError(400, "Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol");
  }

  return password.trim();
};

const createRefreshToken = async (userId, days = 30, meta = {}) => {
  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * days);

  const data = {
    tokenHash,
    userId,
    expiresAt,
    ip: meta.ip || null,
    userAgent: meta.userAgent || null,
    deviceName: meta.deviceName || null,
    lastUsedAt: meta.lastUsedAt || new Date(),
  };

  await prisma.refreshToken.create({ data });

  return { token, expiresAt };
};

const revokeRefreshToken = async (token) => {
  const tokenHash = hashToken(token);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!existing) {return false;}
  await prisma.refreshToken.update({ where: { tokenHash }, data: { revoked: true } });
  return true;
};

const revokeRefreshTokenById = async (id, userId) => {
  const existing = await prisma.refreshToken.findUnique({ where: { id } });
  if (!existing) {return false;}
  if (existing.userId !== userId) {return false;}
  await prisma.refreshToken.update({ where: { id }, data: { revoked: true } });
  return true;
};

const revokeAllRefreshTokensForUser = async (userId) => {
  await prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
  return true;
};

const listSessionsForUser = async (userId) => {
  return prisma.refreshToken.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, revoked: true, expiresAt: true, ip: true, userAgent: true, deviceName: true, lastUsedAt: true, createdAt: true, updatedAt: true },
  });
};

const refreshAccessToken = async (token) => {
  const tokenHash = hashToken(token);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!record || record.revoked) {
    throw new AppError(401, "Invalid refresh token");
  }

  if (new Date(record.expiresAt) < new Date()) {
    throw new AppError(401, "Refresh token expired");
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) {throw new AppError(401, "User not found for refresh token");}

  const meta = { ip: record.ip, userAgent: record.userAgent, deviceName: record.deviceName };
  const claimed = await prisma.refreshToken.updateMany({
    where: { tokenHash, revoked: false },
    data: { revoked: true, lastUsedAt: new Date() },
  });
  if (claimed.count !== 1) {
    throw new AppError(401, "Invalid refresh token");
  }

  const { token: newToken } = await createRefreshToken(user.id, undefined, meta);
  const accessToken = signToken(user.id);

  return { accessToken, refreshToken: newToken };
};


const registerUser = async ({ name, username, email, password }) => {
  const normalizedName = name?.trim();
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPassword = password?.trim();

  if (!normalizedName || !username || !normalizedEmail || !normalizedPassword) {
    throw new AppError(400, "Name, username, email, and password are required");
  }

  validatePasswordStrength(normalizedPassword);

  // 1. Check if email is already registered
  const existingEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingEmail) {
    throw new AppError(400, "Email already registered");
  }

  // 2. Resolve username collision
  let baseUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (baseUsername.length < 3) {
    baseUsername = `user_${Math.floor(1000 + Math.random() * 9000)}`;
  }
  let finalUsername = baseUsername;
  let isUsernameTaken = await prisma.user.findUnique({
    where: { username: finalUsername },
  });

  while (isUsernameTaken) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    // Ensure the generated username fits within limits (max 24 characters)
    const base = baseUsername.slice(0, 19);
    finalUsername = `${base}_${randomSuffix}`;
    isUsernameTaken = await prisma.user.findUnique({
      where: { username: finalUsername },
    });
  }

  const hashedPassword = await bcrypt.hash(normalizedPassword, 12);

  try {
    return await prisma.user.create({
      data: {
        name: normalizedName,
        username: finalUsername,
        email: normalizedEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        coverImage: true,
        bio: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError(400, "A user with that email or username already exists");
    }
    throw error;
  }
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPassword = password?.trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new AppError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      password: true,
      avatar: true,
      coverImage: true,
      bio: true,
      role: true,
      isVerified: true,
      skills: true,
      portfolioLinks: true,
      subscription: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(normalizedPassword, user.password);

  if (!isMatch) {
    throw new AppError(401, "Invalid email or password");
  }

  const { password: userPassword, ...userWithoutPassword } = user;
  void userPassword;
  return userWithoutPassword;
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatar: true,
      coverImage: true,
      bio: true,
      role: true,
      isVerified: true,
      skills: true,
      portfolioLinks: true,
      subscription: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

module.exports = {
  signToken,
  createRefreshToken,
  revokeRefreshToken,
  revokeRefreshTokenById,
  revokeAllRefreshTokensForUser,
  listSessionsForUser,
  refreshAccessToken,
  registerUser,
  loginUser,
  getUserById,
};

