const { body, query, param } = require("express-validator");

const REPORT_TARGET_TYPES = ["USER", "POST", "COMMENT", "JOB", "PROJECT", "COMMUNITY"];
const REPORT_ACTIONS = ["RESOLVED", "DISMISSED"];
const REPORT_STATUS_VALUES = ["PENDING", "RESOLVED", "DISMISSED"];

const paginationRules = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
];

const userListValidationRules = [
  ...paginationRules,
  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "name", "username", "email", "role"])
    .withMessage("sortBy must be one of: createdAt, updatedAt, name, username, email, role"),
  query("role")
    .optional()
    .isIn(["USER", "ADMIN", "SUPER_ADMIN"])
    .withMessage("Role must be USER, ADMIN, or SUPER_ADMIN"),
  query("q").optional().trim().isString(),
];

const communityListValidationRules = [
  ...paginationRules,
  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "name", "slug"])
    .withMessage("sortBy must be one of: createdAt, updatedAt, name, slug"),
  query("q").optional().trim().isString(),
];

const postListValidationRules = [
  ...paginationRules,
  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt"])
    .withMessage("sortBy must be one of: createdAt, updatedAt"),
  query("q").optional().trim().isString(),
];

const commentListValidationRules = [
  ...paginationRules,
  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt"])
    .withMessage("sortBy must be one of: createdAt, updatedAt"),
  query("q").optional().trim().isString(),
];

const jobListValidationRules = [
  ...paginationRules,
  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "title", "status"])
    .withMessage("sortBy must be one of: createdAt, updatedAt, title, status"),
  query("status").optional().trim().isString(),
  query("q").optional().trim().isString(),
];

const projectListValidationRules = [
  ...paginationRules,
  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "title", "status"])
    .withMessage("sortBy must be one of: createdAt, updatedAt, title, status"),
  query("status").optional().trim().isString(),
  query("q").optional().trim().isString(),
];

const reportListValidationRules = [
  ...paginationRules,
  query("status")
    .optional()
    .isIn(REPORT_STATUS_VALUES)
    .withMessage(`Status must be one of: ${REPORT_STATUS_VALUES.join(", ")}`),
  query("targetType")
    .optional()
    .isIn(REPORT_TARGET_TYPES)
    .withMessage(`Target type must be one of: ${REPORT_TARGET_TYPES.join(", ")}`),
];

const reportCreateValidationRules = [
  body("targetType")
    .trim()
    .notEmpty()
    .withMessage("Target type is required")
    .isIn(REPORT_TARGET_TYPES)
    .withMessage(`Target type must be one of: ${REPORT_TARGET_TYPES.join(", ")}`),
  body("targetId")
    .trim()
    .notEmpty()
    .withMessage("Target ID is required"),
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Reason is required")
    .isLength({ min: 5, max: 250 })
    .withMessage("Reason must be between 5 and 250 characters"),
  body("details")
    .optional()
    .trim()
    .isString()
    .withMessage("Details must be a string"),
];

const reportResolutionRules = [
  body("action")
    .trim()
    .notEmpty()
    .withMessage("Action is required")
    .isIn(REPORT_ACTIONS)
    .withMessage(`Action must be one of: ${REPORT_ACTIONS.join(", ")}`),
  body("resolutionNotes")
    .optional()
    .trim()
    .isString()
    .withMessage("Resolution notes must be a string"),
];

const idParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("ID parameter is required"),
];

module.exports = {
  paginationRules,
  userListValidationRules,
  communityListValidationRules,
  postListValidationRules,
  commentListValidationRules,
  jobListValidationRules,
  projectListValidationRules,
  reportListValidationRules,
  reportCreateValidationRules,
  reportResolutionRules,
  idParamRules,
};
