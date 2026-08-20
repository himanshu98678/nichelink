const { body, param, query } = require("express-validator");

const createConversationRules = [
  body("isGroup").optional().isBoolean().withMessage("isGroup must be a boolean"),
  body("targetUserId")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("targetUserId must be a non-empty string"),
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Group name must be between 1 and 100 characters"),
  body("memberIds")
    .optional()
    .isArray()
    .withMessage("memberIds must be an array of user IDs"),
  body().custom((value, { req }) => {
    const isGroup = req.body.isGroup === true || req.body.isGroup === "true";
    if (isGroup) {
      if (!req.body.name || typeof req.body.name !== "string" || !req.body.name.trim()) {
        throw new Error("Group name is required for group conversations");
      }
    } else {
      if (!req.body.targetUserId || typeof req.body.targetUserId !== "string" || !req.body.targetUserId.trim()) {
        throw new Error("targetUserId is required for one-to-one conversations");
      }
    }
    return true;
  }),
];

const updateGroupRules = [
  param("id").trim().notEmpty().withMessage("Conversation ID parameter is required"),
  body("name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Group name must be between 1 and 100 characters"),
];

const addMembersRules = [
  param("id").trim().notEmpty().withMessage("Conversation ID parameter is required"),
  body("memberIds")
    .isArray({ min: 1 })
    .withMessage("memberIds must be a non-empty array of user IDs"),
];

const removeMemberRules = [
  param("id").trim().notEmpty().withMessage("Conversation ID parameter is required"),
  param("userId").trim().notEmpty().withMessage("User ID parameter is required"),
];

const idParamRules = [
  param("id").trim().notEmpty().withMessage("Conversation ID parameter is required"),
];

const listConversationsRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

module.exports = {
  createConversationRules,
  updateGroupRules,
  addMembersRules,
  removeMemberRules,
  idParamRules,
  listConversationsRules,
};
