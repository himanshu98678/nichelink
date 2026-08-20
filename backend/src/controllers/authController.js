const { registerUser, loginUser, getUserById, signToken, createRefreshToken, refreshAccessToken, revokeRefreshToken, listSessionsForUser, revokeRefreshTokenById, revokeAllRefreshTokensForUser } = require("../services/authService");
const { buildUserResponse } = require("../models/user");
const emailService = require("../services/emailService");
const oauthService = require("../services/oauthService");
const userService = require("../services/userService");
const AppError = require("../utils/AppError");

const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    const token = signToken(user.id);

    // Issue refresh token for longer sessions with session metadata
    const meta = { ip: req.ip, userAgent: req.get('user-agent') };
    const { token: refreshToken } = await createRefreshToken(user.id, undefined, meta);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      refreshToken,
      user: buildUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const user = await loginUser(req.body);
    const token = signToken(user.id);
    const meta = { ip: req.ip, userAgent: req.get('user-agent') };
    const { token: refreshToken } = await createRefreshToken(user.id, undefined, meta);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: buildUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);

    return res.status(200).json({
      success: true,
      user: buildUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {return res.status(400).json({ success: false, message: "Email is required" });}

    const normalizedEmail = email.trim().toLowerCase();
    const user = await require("../lib/prisma").user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {return res.status(200).json({ success: true, message: "If that email exists, a verification email has been sent" });}

    if (user.isVerified) {
      return res.status(200).json({ success: true, message: "Email is already verified" });
    }

    await emailService.sendVerificationEmailToUser(user);
    return res.status(200).json({ success: true, message: "Verification email sent" });
  } catch (error) {
    return next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {return res.status(400).json({ success: false, message: "Verification token is required" });}

    const user = await emailService.verifyEmailToken(token);
    return res.status(200).json({ success: true, message: "Email verified successfully", user: buildUserResponse(user) });
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {return res.status(400).json({ success: false, message: "Email is required" });}

    const normalizedEmail = email.trim().toLowerCase();
    const user = await require("../lib/prisma").user.findUnique({ where: { email: normalizedEmail } });

    // Always respond success to avoid user enumeration
    if (user) {
      await emailService.sendPasswordResetEmail(user);
    }

    return res.status(200).json({ success: true, message: "If that email exists, a password reset email has been sent" });
  } catch (error) {
    return next(error);
  }
};

// Exchange refresh token for new access token
const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {return res.status(400).json({ success: false, message: "Refresh token is required" });}

    const tokens = await refreshAccessToken(token);
    return res.status(200).json({ success: true, ...tokens });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {return res.status(400).json({ success: false, message: "Refresh token is required" });}

    await revokeRefreshToken(token);
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return next(error);
  }
};

const sessions = async (req, res, next) => {
  try {
    const sessions = await listSessionsForUser(req.user.id);
    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    return next(error);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId || req.body.sessionId;
    if (!sessionId) {return res.status(400).json({ success: false, message: "sessionId is required" });}

    const ok = await revokeRefreshTokenById(sessionId, req.user.id);
    if (!ok) {return res.status(404).json({ success: false, message: "Session not found" });}

    return res.status(200).json({ success: true, message: "Session revoked" });
  } catch (error) {
    return next(error);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await revokeAllRefreshTokensForUser(req.user.id);
    return res.status(200).json({ success: true, message: "All sessions revoked" });
  } catch (error) {
    return next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {return res.status(400).json({ success: false, message: "Current and new password are required" });}

    const prisma = require("../lib/prisma");
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {throw new AppError(404, "User not found");}

    const match = await require("bcryptjs").compare(currentPassword, user.password);
    if (!match) {return res.status(401).json({ success: false, message: "Current password is incorrect" });}

    const normalizedPassword = newPassword.trim();
    const passwordStrengthPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordStrengthPattern.test(normalizedPassword)) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters long and include uppercase, lowercase, number, and symbol" });
    }

    const hashed = await require("bcryptjs").hash(normalizedPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    // Revoke all refresh tokens after password change to force re-login on other devices
    const { revokeAllRefreshTokensForUser } = require("../services/authService");
    await revokeAllRefreshTokensForUser(req.user.id);

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {return res.status(400).json({ success: false, message: "Token and new password are required" });}

    const prisma = require("../lib/prisma");
    const passwordResetTokenHash = require("crypto").createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findFirst({ where: { passwordResetToken: passwordResetTokenHash } });

    const resetSucceeded = await emailService.resetPasswordWithToken({ token, password });
    if (!resetSucceeded) {
      return res.status(400).json({ success: false, message: "Password reset token has expired" });
    }

    if (user) {
      const { revokeAllRefreshTokensForUser } = require("../services/authService");
      await revokeAllRefreshTokensForUser(user.id);
    }

    return res.status(200).json({ success: true, message: "Password has been reset successfully" });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updated = await userService.updateUserProfile(req.user.id, req.body);
    return res.status(200).json({ success: true, message: "Profile updated", user: buildUserResponse(updated) });
  } catch (error) {
    return next(error);
  }
};

const google = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {return res.status(400).json({ success: false, message: "idToken is required" });}

    const result = await oauthService.exchangeGoogleToken({ idToken });
    const token = result.token || signToken(result.user.id);
    const meta = { ip: req.ip, userAgent: req.get("user-agent") };
    const { token: refreshToken } = await createRefreshToken(result.user.id, undefined, meta);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: buildUserResponse(result.user),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  me,
  resendVerification,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  google,
  refreshToken,
  logout,
  changePassword,
  sessions,
  revokeSession,
  logoutAll,
};