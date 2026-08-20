const { query } = require("express-validator");

const SEARCH_TYPES = [
  "all",
  "users",
  "communities",
  "posts",
  "comments",
  "jobs",
  "projects",
  "tasks",
  "messages",
];

const SORT_FIELDS = ["relevance", "latest", "oldest", "alphabetical"];
const FILTER_FIELDS = ["date", "author", "community", "category", "status", "priority", "skills", "location"];

const searchValidationRules = [
  query("q").trim().notEmpty().withMessage("Query is required"),
  query("type")
    .optional()
    .trim()
    .custom((value) => SEARCH_TYPES.includes(String(value).toLowerCase()))
    .withMessage(`type must be one of: ${SEARCH_TYPES.join(", ")}`),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("sortBy")
    .optional()
    .trim()
    .custom((value) => SORT_FIELDS.includes(String(value).toLowerCase()))
    .withMessage(`sortBy must be one of: ${SORT_FIELDS.join(", ")}`),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
  query("date").optional().isISO8601().withMessage("date must be a valid ISO 8601 date"),
  query("author").optional().isString().trim(),
  query("community").optional().isString().trim(),
  query("category").optional().isString().trim(),
  query("status").optional().isString().trim(),
  query("priority").optional().isString().trim(),
  query("skills").optional().isString().trim(),
  query("location").optional().isString().trim(),
];

const suggestionValidationRules = [
  query("q").optional().isString().trim(),
];

const trendingValidationRules = [
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

module.exports = {
  searchValidationRules,
  suggestionValidationRules,
  trendingValidationRules,
  SEARCH_TYPES,
  SORT_FIELDS,
  FILTER_FIELDS,
};
