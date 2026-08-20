const { query, param } = require("express-validator");

const feedQueryValidationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("communityId").optional().isString().trim(),
  query("authorId").optional().isString().trim(),
  query("visibility").optional().isIn(["PUBLIC", "FOLLOWERS", "PRIVATE"]).withMessage("Invalid visibility value"),
  query("from").optional().isISO8601().withMessage("From date must be a valid ISO8601 date"),
  query("to").optional().isISO8601().withMessage("To date must be a valid ISO8601 date"),
  query("q").optional().isString().trim(),
];

const communityFeedValidationRules = [
  param("communityId").trim().notEmpty().withMessage("Community ID is required"),
  ...feedQueryValidationRules,
];

const userFeedValidationRules = [
  param("userId").trim().notEmpty().withMessage("User ID is required"),
  ...feedQueryValidationRules,
];

const searchFeedValidationRules = [
  query("q").optional().isString().trim(),
  ...feedQueryValidationRules,
];

module.exports = {
  feedQueryValidationRules,
  communityFeedValidationRules,
  userFeedValidationRules,
  searchFeedValidationRules,
};
