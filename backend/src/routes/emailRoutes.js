const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");
const {
  sendOtpRules,
  verifyOtpRules,
  updatePreferencesRules,
} = require("../validators/emailValidators");
const emailController = require("../controllers/emailController");

router.post("/otp", ...sendOtpRules, validateRequest, emailController.sendOtp);
router.post("/otp/verify", ...verifyOtpRules, validateRequest, emailController.verifyOtp);
router.get("/preferences", authenticate, emailController.getPreferences);
router.put(
  "/preferences",
  authenticate,
  ...updatePreferencesRules,
  validateRequest,
  emailController.updatePreferences
);

module.exports = router;
