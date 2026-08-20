const { body } = require("express-validator");

const otpTypeRules = ["LOGIN", "VERIFY", "PASSWORD_RESET", "TRANSACTION", "SECURITY"];

const sendOtpRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address"),
  body("type")
    .optional()
    .trim()
    .isIn(otpTypeRules)
    .withMessage(`OTP type must be one of: ${otpTypeRules.join(", ")}`),
];

const verifyOtpRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address"),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("OTP code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP code must be a 6-digit value")
    .isNumeric()
    .withMessage("OTP code must contain only digits"),
  body("type")
    .optional()
    .trim()
    .isIn(otpTypeRules)
    .withMessage(`OTP type must be one of: ${otpTypeRules.join(", ")}`),
];

const updatePreferencesRules = [
  body("preferences")
    .exists()
    .withMessage("Preferences are required")
    .isObject()
    .withMessage("Preferences must be an object"),
  body("preferences.marketing")
    .optional()
    .isBoolean()
    .withMessage("marketing preference must be true or false"),
  body("preferences.notifications")
    .optional()
    .isBoolean()
    .withMessage("notifications preference must be true or false"),
  body("preferences.productUpdates")
    .optional()
    .isBoolean()
    .withMessage("productUpdates preference must be true or false"),
  body("preferences.securityAlerts")
    .optional()
    .isBoolean()
    .withMessage("securityAlerts preference must be true or false"),
];

module.exports = {
  sendOtpRules,
  verifyOtpRules,
  updatePreferencesRules,
};
