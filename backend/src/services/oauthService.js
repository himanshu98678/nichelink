const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { signToken } = require("./authService");

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

const exchangeGoogleToken = async ({ idToken }) => {
  if (!googleClient) {
    throw new AppError(500, "Google OAuth is not configured");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError(400, "Invalid Google authentication token");
  }

  const normalizedEmail = payload.email.toLowerCase();
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    const baseName = (payload.given_name || payload.name || payload.email.split("@")[0]).trim();
    const baseUsername = `${baseName.toLowerCase().replace(/[^a-z0-9_]/g, "")}${Math.random().toString(36).slice(2, 6)}`.slice(0, 24);
    const randomPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    user = await prisma.user.create({
      data: {
        name: payload.name || baseName,
        username: baseUsername,
        email: normalizedEmail,
        password: hashedPassword,
        googleId: payload.sub,
        provider: "google",
        isVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  } else if (!user.googleId && !user.provider) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: payload.sub,
        provider: "google",
        isVerified: true,
        emailVerifiedAt: user.emailVerifiedAt || new Date(),
      },
    });
  }

  const token = signToken(user.id);
  return { user, token };
};

module.exports = {
  exchangeGoogleToken,
};
