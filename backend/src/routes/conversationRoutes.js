const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");

const conversationController = require("../controllers/conversationController");
const messageController = require("../controllers/messageController");

const {
  createConversationRules,
  updateGroupRules,
  addMembersRules,
  removeMemberRules,
  idParamRules,
  listConversationsRules,
} = require("../validators/conversationValidators");
const { listMessagesRules } = require("../validators/messageValidators");

// Conversations list / create
router.post("/", authenticate, ...createConversationRules, validateRequest, conversationController.create);
router.get("/", authenticate, ...listConversationsRules, validateRequest, conversationController.list);

// Conversation detail / update / delete
router.get("/:id", authenticate, ...idParamRules, validateRequest, conversationController.getById);
router.patch("/:id", authenticate, ...updateGroupRules, validateRequest, conversationController.update);
router.delete("/:id", authenticate, ...idParamRules, validateRequest, conversationController.remove);

// Members management
router.post("/:id/members", authenticate, ...addMembersRules, validateRequest, conversationController.addMembers);
router.delete(
  "/:id/members/:userId",
  authenticate,
  ...removeMemberRules,
  validateRequest,
  conversationController.removeMember
);
router.delete("/:id/leave", authenticate, ...idParamRules, validateRequest, conversationController.leave);

// Get messages for a conversation
router.get("/:id/messages", authenticate, ...listMessagesRules, validateRequest, messageController.listByConversation);

module.exports = router;
