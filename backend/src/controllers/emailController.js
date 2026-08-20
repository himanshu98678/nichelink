const emailService = require("../services/emailService");

const sendOtp = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    const result = await emailService.sendOtpCodeToUser({ email, type });

    if (result && result.success === false) {
      return res.status(400).json({
        success: false,
        message: result.message || "Unable to send OTP. Please verify the email address and try again.",
        delivery: result.delivery || null,
      });
    }

    return res.status(200).json({
      success: true,
      message: result?.message || "Verification OTP sent successfully. Please check your email inbox and spam folder.",
      delivery: result?.delivery || null,
    });
  } catch (error) {
    return next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, code, type } = req.body;
    await emailService.verifyOtpCode({ email, code, type });
    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    next(error);
  }
};

const getPreferences = async (req, res, next) => {
  try {
    const preferences = await emailService.getUserEmailPreferences(req.user.id);
    res.status(200).json({ success: true, preferences });
  } catch (error) {
    next(error);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const preferences = await emailService.updateUserEmailPreferences(req.user.id, req.body.preferences);
    res.status(200).json({ success: true, preferences });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  getPreferences,
  updatePreferences,
};
