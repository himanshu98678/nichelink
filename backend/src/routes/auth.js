const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");
const {
  registerValidationRules,
  loginValidationRules,
  sendVerificationValidationRules: emailValidationRules,
  resetPasswordValidationRules,
  googleAuthValidationRules: googleValidationRules,
} = require("../validators/authValidators");
const { profileValidationRules } = require("../validators/profileValidators");

const {
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
} = require("../controllers/authController");

router.post("/register", ...registerValidationRules, validateRequest, register);
router.post("/login", ...loginValidationRules, validateRequest, login);
router.get("/me", authenticate, me);

// Verification
router.post("/verify-email", ...emailValidationRules, validateRequest, resendVerification);
router.get("/verify-email/:token", verifyEmail);

// Password reset
router.post("/forgot-password", ...emailValidationRules, validateRequest, forgotPassword);
router.post("/reset-password", ...resetPasswordValidationRules, validateRequest, resetPassword);

// Token refresh & logout
const { body } = require('express-validator');
const refreshValidation = [body('token').trim().notEmpty().withMessage('Refresh token is required')];
router.post('/refresh-token', ...refreshValidation, validateRequest, refreshToken);
router.post('/logout', ...refreshValidation, validateRequest, logout);

// Profile update
router.put('/profile', authenticate, ...profileValidationRules, validateRequest, updateProfile);

// Sessions management
router.get('/sessions', authenticate, sessions);
router.delete('/sessions/:sessionId', authenticate, revokeSession);
router.post('/logout-all', authenticate, logoutAll);

// Change password
const changePasswordValidation = [
  body('currentPassword').trim().notEmpty().withMessage('Current password is required'),
  body('newPassword').trim().isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
];
router.post('/change-password', authenticate, ...changePasswordValidation, validateRequest, changePassword);

// Google OAuth
router.post('/google', ...googleValidationRules, validateRequest, google);

module.exports = router;