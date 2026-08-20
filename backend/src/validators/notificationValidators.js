const { query, param } = require("express-validator");

const listNotificationsRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("type")
    .optional()
    .isIn([
      "LIKE",
      "COMMENT",
      "REPLY",
      "MENTION",
      "FOLLOW",
      "COMMUNITY_LEAVE",
      "MESSAGE",
      "COMMUNITY_INVITE",
      "COMMUNITY_JOIN",
      "COMMUNITY_INVITE_ACCEPTED",
      "POST_SHARED",
      "JOB_APPLICATION",
      "PROJECT_INVITE",
      "PROJECT_REMOVED",
      "REPORT_RESOLVED",
      "SYSTEM",
    ])
    .withMessage("Invalid notification type filter"),
  query("isRead").optional().isBoolean().withMessage("isRead must be a boolean value"),
  query("from").optional().isISO8601().withMessage("From date must be a valid ISO8601 date"),
  query("to").optional().isISO8601().withMessage("To date must be a valid ISO8601 date"),
];

const idParamRules = [
  param("id").trim().notEmpty().withMessage("Notification ID parameter is required"),
];

module.exports = {
  listNotificationsRules,
  idParamRules,
};
