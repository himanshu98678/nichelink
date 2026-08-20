const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");

const notificationController = require("../controllers/notificationController");
const { listNotificationsRules, idParamRules } = require("../validators/notificationValidators");

// GET endpoints
router.get("/", authenticate, ...listNotificationsRules, validateRequest, notificationController.list);
router.get("/unread-count", authenticate, notificationController.unreadCount);

// PATCH read endpoints
router.patch("/read-all", authenticate, notificationController.markAllRead);
router.patch("/:id/read", authenticate, ...idParamRules, validateRequest, notificationController.markRead);

// DELETE endpoints
router.delete("/", authenticate, notificationController.removeAll);
router.delete("/:id", authenticate, ...idParamRules, validateRequest, notificationController.remove);

module.exports = router;
