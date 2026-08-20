const nodemailer = require("nodemailer");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const { env } = require("../config/env");
const AppError = require("../utils/AppError");
const { logger } = require("../utils/logger");

const DEFAULT_EMAIL_PREFERENCES = {
  marketing: true,
  notifications: true,
  productUpdates: true,
  securityAlerts: true,
};

const OTP_CODE_LENGTH = 6;
const OTP_EXPIRATION_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = Number(env.OTP_RESEND_COOLDOWN_SECONDS ?? 30);
const MAX_EMAIL_QUEUE_ATTEMPTS = 5;

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const createToken = () => crypto.randomBytes(24).toString("hex");
const hashOtpCode = (code) => hashToken(code);
const createOtpCode = () => String(crypto.randomInt(0, 10 ** OTP_CODE_LENGTH)).padStart(OTP_CODE_LENGTH, "0");
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const maskEmail = (email) => {
  const [localPart, domain] = String(email || "").split("@");
  if (!localPart || !domain) {
    return "<invalid-email>";
  }
  return `${localPart.slice(0, 2)}***@${domain}`;
};

const normalizedEmailFrom = env.EMAIL_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@nichelink.local";
if (process.env.EMAIL_FROM === undefined && normalizedEmailFrom) {
  process.env.EMAIL_FROM = normalizedEmailFrom;
}

const getTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      pool: true,
      maxConnections: 2,
      maxMessages: 100,
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }
  return null;
};

const verifyTransport = async () => {
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.warn({ smtpConfigured: false, smtpHost: Boolean(process.env.SMTP_HOST) }, "SMTP transport is not configured; email delivery will be preview-only");
    return { verified: false, reason: "SMTP transport not configured" };
  }

  try {
    await activeTransporter.verify();
    logger.info(
      {
        smtpHost: process.env.SMTP_HOST,
        smtpPort: Number(process.env.SMTP_PORT || 587),
        smtpSecure: process.env.SMTP_SECURE === "true",
        smtpUserConfigured: Boolean(process.env.SMTP_USER),
        emailFrom: process.env.EMAIL_FROM || "not-configured",
      },
      "SMTP transport verified"
    );
    return { verified: true };
  } catch (error) {
    logger.error(
      {
        err: error,
        smtpHost: process.env.SMTP_HOST,
        smtpPort: Number(process.env.SMTP_PORT || 587),
        smtpSecure: process.env.SMTP_SECURE === "true",
        smtpUserConfigured: Boolean(process.env.SMTP_USER),
      },
      "SMTP startup verification failed"
    );
    throw error;
  }
};

const queueEmail = async ({ to, subject, text, html }) => {
  return prisma.emailQueue.create({
    data: {
      to,
      subject,
      text,
      html,
      status: "pending",
    },
  });
};

const sendMailDirect = async ({ to, subject, text, html }) => {
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    if (process.env.NODE_ENV !== "production") {
      logger.info({ to: maskEmail(to), subject }, "Email preview logged (SMTP not configured in non-production)");
      return { accepted: [to], preview: text, messageId: "preview-mode" };
    }
    const error = new Error("SMTP transport not configured. Email delivery failed.");
    logger.error(
      {
        to: maskEmail(to),
        subject,
        smtpHost: process.env.SMTP_HOST || "NOT SET",
        smtpUserConfigured: Boolean(process.env.SMTP_USER),
        err: error,
      },
      "Email delivery failed: SMTP transport not configured"
    );
    throw error;
  }

  const startedAt = Date.now();
  try {
    const result = await activeTransporter.sendMail({
      from: process.env.EMAIL_FROM || env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@nichelink.local",
      to,
      subject,
      text,
      html,
    });


    logger.info(
      {
        to: maskEmail(to),
        subject,
        messageId: result?.messageId,
        accepted: result?.accepted,
        rejected: result?.rejected,
        response: result?.response,
        durationMs: Date.now() - startedAt,
      },
      "SMTP delivery result"
    );

    return result;
  } catch (error) {
    logger.error(
      {
        err: error,
        to: maskEmail(to),
        subject,
        smtpHost: process.env.SMTP_HOST,
        smtpUserConfigured: Boolean(process.env.SMTP_USER),
        response: error?.response,
        code: error?.code,
        command: error?.command,
        durationMs: Date.now() - startedAt,
      },
      "SMTP delivery rejected or failed"
    );
    throw error;
  }
};

logger.info(
  {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    userConfigured: Boolean(process.env.SMTP_USER),
    queueEnabled: process.env.EMAIL_QUEUE_ENABLED === "true",
    fromConfigured: Boolean(process.env.EMAIL_FROM || env.EMAIL_FROM),
  },
  "SMTP CONFIG"
);

const sendMail = async ({ to, subject, text, html }) => {
  if (process.env.EMAIL_QUEUE_ENABLED === "true") {
    await queueEmail({ to, subject, text, html });
    return { accepted: [to], queued: true, preview: text };
  }

  return sendMailDirect({ to, subject, text, html });
};

const processPendingEmails = async (limit = 25) => {
  const queueItems = await prisma.emailQueue.findMany({
    where: {
      status: "pending",
      attempts: { lt: MAX_EMAIL_QUEUE_ATTEMPTS },
    },
    orderBy: { queuedAt: "asc" },
    take: limit,
  });

  const results = [];
  for (const item of queueItems) {
    try {
      await sendMailDirect({ to: item.to, subject: item.subject, text: item.text, html: item.html });
      const updated = await prisma.emailQueue.update({
        where: { id: item.id },
        data: { status: "sent", sentAt: new Date(), attempts: item.attempts + 1, lastAttemptAt: new Date(), error: null },
      });
      results.push(updated);
    } catch (error) {
      await prisma.emailQueue.update({
        where: { id: item.id },
        data: {
          status: item.attempts + 1 >= MAX_EMAIL_QUEUE_ATTEMPTS ? "failed" : "pending",
          attempts: item.attempts + 1,
          lastAttemptAt: new Date(),
          error: String(error.message || error),
        },
      });
      results.push({ id: item.id, error: String(error.message || error) });
    }
  }

  return results;
};

const getUserEmailPreferences = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailPreferences: true },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return { ...DEFAULT_EMAIL_PREFERENCES, ...(user.emailPreferences || {}) };
};

const updateUserEmailPreferences = async (userId, preferences) => {
  const existing = await getUserEmailPreferences(userId);
  const merged = { ...existing, ...preferences };

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { emailPreferences: merged },
    select: { emailPreferences: true },
  });

  return { ...DEFAULT_EMAIL_PREFERENCES, ...(updated.emailPreferences || {}) };
};

const createVerificationToken = async (userId) => {
  const token = createToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationToken: tokenHash,
      verificationTokenExpiresAt: expiresAt,
    },
  });

  return { token, expiresAt };
};

const sendVerificationEmailToUser = async (user, explicitToken) => {
  const { token, expiresAt } = explicitToken ? { token: explicitToken, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) } : await createVerificationToken(user.id);
  const subject = "Verify your NicheLink email";
  const text = `Hi ${user.name},\n\nPlease verify your email by visiting: ${process.env.APP_URL || "http://localhost:5000"}/api/auth/verify-email/${token}\n\nThis link expires on ${expiresAt.toISOString()}`;
  const html = `<p>Hi ${user.name},</p><p>Please verify your email by clicking <a href="${process.env.APP_URL || "http://localhost:5000"}/api/auth/verify-email/${token}">this link</a>.</p><p>This link expires on ${expiresAt.toISOString()}</p>`;

  try {
    const result = await sendMail({ to: user.email, subject, text, html });
    return { message: "Verification email sent", preview: result?.preview || null };
  } catch (error) {
    logger.warn({ to: maskEmail(user.email), error: error.message }, "Verification email delivery fallback triggered");
    return { message: "Verification email requested", preview: null };
  }
};

const verifyEmailToken = async (token) => {
  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: { verificationToken: tokenHash },
  });

  if (!user) {
    throw new AppError(400, "Invalid verification token");
  }

  if (user.emailVerifiedAt) {
    throw new AppError(400, "Email already verified");
  }

  if (!user.verificationTokenExpiresAt || new Date(user.verificationTokenExpiresAt) < new Date()) {
    throw new AppError(400, "Verification token has expired");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      emailVerifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpiresAt: null,
    },
  });

  return updatedUser;
};

const createPasswordResetToken = async (userId) => {
  const token = createToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: tokenHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  return { token, expiresAt };
};

const sendPasswordResetEmail = async (user) => {
  const { token, expiresAt } = await createPasswordResetToken(user.id);
  const subject = "Reset your NicheLink password";
  const text = `Hi ${user.name},\n\nUse the following token to reset your password: ${token}\n\nThis token expires on ${expiresAt.toISOString()}`;
  const html = `<p>Hi ${user.name},</p><p>Use the following token to reset your password: <strong>${token}</strong></p><p>This token expires on ${expiresAt.toISOString()}</p>`;

  try {
    const result = await sendMail({ to: user.email, subject, text, html });
    return { message: "Password reset email sent", preview: result?.preview || null };
  } catch (error) {
    logger.warn({ to: maskEmail(user.email), error: error.message }, "Password reset email delivery fallback triggered");
    return { message: "Password reset email requested", preview: null };
  }
};

const resetPasswordWithToken = async ({ token, password }) => {
  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: tokenHash },
  });

  if (!user) {
    throw new AppError(400, "Invalid password reset token");
  }

  if (!user.passwordResetExpiresAt || new Date(user.passwordResetExpiresAt) < new Date()) {
    return false;
  }

  const normalizedPassword = password?.trim();
  const passwordStrengthPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!normalizedPassword || !passwordStrengthPattern.test(normalizedPassword)) {
    throw new AppError(400, "Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol");
  }

  const hashedPassword = await require("bcryptjs").hash(normalizedPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });

  return true;
};

const sendWelcomeEmailToUser = async (user) => {
  const subject = "Welcome to NicheLink";
  const text = `Hi ${user.name},\n\nWelcome to NicheLink! We're glad to have you on board.`;
  const html = `<p>Hi ${user.name},</p><p>Welcome to NicheLink! We're glad to have you on board.</p>`;
  const result = await sendMail({ to: user.email, subject, text, html });
  return { message: 'Welcome email sent', preview: result.preview || null };
};

const sendOtpCodeToUser = async ({ email, type = "LOGIN" }) => {
  const requestStartedAt = Date.now();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new AppError(400, "A valid email address is required");
  }

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: "insensitive",
      },
    },
  });

  if (!user) {
    logger.warn(
      {
        email: maskEmail(normalizedEmail),
        targetTable: "User",
        targetField: "email",
      },
      "OTP request rejected: email is not a registered Prisma User email"
    );

    return {
      success: false,
      message: `No registered user found for OTP delivery address`,
      delivery: null,
    };
  }

  const previousOtp = await prisma.emailOtp.findFirst({
    where: { userId: user.id, type, consumedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  if (previousOtp && Date.now() - previousOtp.createdAt.getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
    const retryAfterSeconds = Math.ceil(
      (OTP_RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - previousOtp.createdAt.getTime())) / 1000
    );
    throw new AppError(429, `Please wait ${retryAfterSeconds} seconds before requesting another OTP`);
  }

  const code = createOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  const otp = await prisma.$transaction(async (transaction) => {
    await transaction.emailOtp.deleteMany({
      where: { userId: user.id, type },
    });
    return transaction.emailOtp.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        type,
        codeHash,
        expiresAt,
      },
    });
  });

  const subject = `Your NicheLink ${type} code`;
  const text = `Hi ${user.name},\n\nYour ${type} verification code is ${code}.\n\nThis code expires in ${OTP_EXPIRATION_MINUTES} minutes.`;
  const html = `<p>Hi ${user.name},</p><p>Your <strong>${type}</strong> verification code is <strong>${code}</strong>.</p><p>This code expires in ${OTP_EXPIRATION_MINUTES} minutes.</p>`;

  try {
    const result = await sendMailDirect({ to: normalizedEmail, subject, text, html });

    const accepted = Array.isArray(result?.accepted) ? result.accepted : [];
    const rejected = Array.isArray(result?.rejected) ? result.rejected : [];
    const mailAcceptedForRecipient = accepted.some((entry) => String(entry).toLowerCase() === normalizedEmail);

    if (!result?.messageId || !mailAcceptedForRecipient || rejected.length > 0) {
      throw new AppError(
        502,
        `Email provider rejected OTP delivery. Please try again.`
      );
    }

    logger.info(
      {
        email: maskEmail(normalizedEmail),
        messageId: result?.messageId || null,
        type,
        totalDurationMs: Date.now() - requestStartedAt,
      },
      "OTP email sent successfully"
    );

    return {
      success: true,
      message: "OTP email sent",
      delivery: {
        messageId: result?.messageId || null,
        response: result?.response || null,
      },
    };
  } catch (error) {
    logger.error(
      {
        email: maskEmail(normalizedEmail),
        type,
        err: error,
        totalDurationMs: Date.now() - requestStartedAt,
      },
      "Failed to send OTP email"
    );
    await prisma.emailOtp.deleteMany({ where: { id: otp.id } });
    throw error;
  }
};

const verifyOtpCode = async ({ email, code, type = "LOGIN" }) => {
  const normalizedEmail = normalizeEmail(email);
  const codeHash = hashOtpCode(code);

  const otp = await prisma.emailOtp.findFirst({
  where: {
    email: normalizedEmail,
    type,
    codeHash,
    consumedAt: null,
    expiresAt: {
      gt: new Date(),
    },
  },
  orderBy: {
    createdAt: "desc",
  },
});

  if (!otp) {
    throw new AppError(400, "Invalid or expired OTP code");
  }

  const [consumedOtp] = await prisma.$transaction([
    prisma.emailOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    }),
    ...(type === "VERIFY"
      ? [
          prisma.user.update({
            where: { id: otp.userId },
            data: { isVerified: true, emailVerifiedAt: new Date() },
          }),
        ]
      : []),
  ]);

  return { success: true, userId: consumedOtp.userId };
};

module.exports = {
  verifyTransport,
  sendVerificationEmailToUser,
  verifyEmailToken,
  sendPasswordResetEmail,
  resetPasswordWithToken,
  createVerificationToken,
  createPasswordResetToken,
  sendWelcomeEmailToUser,
  sendOtpCodeToUser,
  verifyOtpCode,
  getUserEmailPreferences,
  updateUserEmailPreferences,
  processPendingEmails,
};
