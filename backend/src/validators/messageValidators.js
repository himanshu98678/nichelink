const { body, param, query } = require("express-validator");

const sendMessageRules = [
  body("conversationId")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("conversationId is required"),
  body("content")
    .optional()
    .isString()
    .isLength({ max: 5000 })
    .withMessage("Message content must be 5000 characters or fewer"),
  body("replyToId")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("replyToId must be a valid string"),
  body("attachments")
    .optional()
    .isArray()
    .withMessage("attachments must be an array"),
  body("attachments.*.url")
    .optional()
    .isURL()
    .withMessage("Attachment url must be a valid URL"),
  body("attachments.*.fileName")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Attachment fileName must be a string"),
  body("attachments.*.fileType")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Attachment fileType must be a string"),
  body("attachments.*.fileSize")
    .optional()
    .isInt({ min: 1, max: 52428800 })
    .withMessage("Attachment fileSize must be between 1 and 52428800 bytes"),
];

const editMessageRules = [
  param("id").trim().notEmpty().withMessage("Message ID parameter is required"),
  body("content")
    .isString()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Message content must be between 1 and 5000 characters"),
];

const messageIdParamRules = [
  param("id").trim().notEmpty().withMessage("Message ID parameter is required"),
];

const searchMessagesRules = [
  query("q").optional().isString().trim(),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

const listMessagesRules = [
  param("id").trim().notEmpty().withMessage("Conversation ID parameter is required"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

module.exports = {
  sendMessageRules,
  editMessageRules,
  messageIdParamRules,
  searchMessagesRules,
  listMessagesRules,
};
