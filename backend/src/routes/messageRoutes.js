const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");
const { messageLimiter } = require("../middlewares/rateLimiter");

const messageController = require("../controllers/messageController");
const {
  sendMessageRules,
  editMessageRules,
  messageIdParamRules,
  searchMessagesRules,
} = require("../validators/messageValidators");

// Messages endpoints
router.post(
  "/",
  authenticate,
  messageLimiter,
  ...sendMessageRules,
  validateRequest,
  messageController.send
);
router.patch("/:id", authenticate, ...editMessageRules, validateRequest, messageController.edit);
router.delete("/:id", authenticate, ...messageIdParamRules, validateRequest, messageController.remove);

// Mark read
router.post("/:id/read", authenticate, ...messageIdParamRules, validateRequest, messageController.markRead);

// Search messages
router.get("/search", authenticate, ...searchMessagesRules, validateRequest, messageController.search);

module.exports = router;
