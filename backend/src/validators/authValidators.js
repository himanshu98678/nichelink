const { body } = require("express-validator");

const passwordStrengthPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const registerValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 24 })
    .withMessage("Username must be between 3 and 24 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .matches(passwordStrengthPattern)
    .withMessage("Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol"),
];

const loginValidationRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required"),
];

const sendVerificationValidationRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address"),
];

const requestPasswordResetValidationRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address"),
];

const resetPasswordValidationRules = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Password reset token is required"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .matches(passwordStrengthPattern)
    .withMessage("Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol"),
];

const googleAuthValidationRules = [
  body("idToken")
    .trim()
    .notEmpty()
    .withMessage("Google idToken is required"),
];

const roleValidationRules = [
  body("userId")
    .trim()
    .notEmpty()
    .withMessage("User ID is required"),
  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["USER", "ADMIN", "SUPER_ADMIN"])
    .withMessage("Role must be USER, ADMIN, or SUPER_ADMIN"),
];

module.exports = {
  registerValidationRules,
  loginValidationRules,
  sendVerificationValidationRules,
  requestPasswordResetValidationRules,
  resetPasswordValidationRules,
  googleAuthValidationRules,
  roleValidationRules,
};
