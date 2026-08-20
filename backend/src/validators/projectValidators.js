const { body, query, param } = require("express-validator");

const PROJECT_STATUS_VALUES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
const PROJECT_PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const titleOrNameExists = body().custom((_, { req }) => {
  const title = req.body.title?.trim();
  const name = req.body.name?.trim();
  if (!title && !name) {
    throw new Error("Project title is required");
  }
  return true;
});

const normalizeChoiceValue = (value) => {
  if (value === undefined || value === null) {return undefined;}
  return String(value).trim().replace(/-/g, "_").toUpperCase();
};

const validStatusValue = (value) => {
  const normalized = normalizeChoiceValue(value);
  return normalized && PROJECT_STATUS_VALUES.includes(normalized);
};

const validPriorityValue = (value) => {
  const normalized = normalizeChoiceValue(value);
  return normalized && PROJECT_PRIORITY_VALUES.includes(normalized);
};

const createProjectValidationRules = [
  titleOrNameExists,
  body("title")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Project title must be 150 characters or fewer"),
  body("name")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Project title must be 150 characters or fewer"),
  body("status")
    .optional({ nullable: true })
    .trim()
    .custom((value) => {
      if (!validStatusValue(value)) {
        throw new Error(`Status must be one of: ${PROJECT_STATUS_VALUES.join(", ")}`);
      }
      return true;
    }),
  body("priority")
    .optional({ nullable: true })
    .trim()
    .custom((value) => {
      if (!validPriorityValue(value)) {
        throw new Error(`Priority must be one of: ${PROJECT_PRIORITY_VALUES.join(", ")}`);
      }
      return true;
    }),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must be 2000 characters or fewer"),
  body("bannerImage").optional({ nullable: true }).custom((value) => {
    try { new URL(value); return true; } catch { throw new Error("Banner image must be a valid URL"); }
  }),
  body("startDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  body("deadline")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Deadline must be a valid ISO 8601 date"),
];

const updateProjectValidationRules = [
  body("title")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Project title must be 150 characters or fewer"),
  body("name")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Project title must be 150 characters or fewer"),
  body("status")
    .optional({ nullable: true })
    .trim()
    .custom((value) => {
      if (!validStatusValue(value)) {
        throw new Error(`Status must be one of: ${PROJECT_STATUS_VALUES.join(", ")}`);
      }
      return true;
    }),
  body("priority")
    .optional({ nullable: true })
    .trim()
    .custom((value) => {
      if (!validPriorityValue(value)) {
        throw new Error(`Priority must be one of: ${PROJECT_PRIORITY_VALUES.join(", ")}`);
      }
      return true;
    }),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must be 2000 characters or fewer"),
  body("bannerImage").optional({ nullable: true }).custom((value) => {
    try { new URL(value); return true; } catch { throw new Error("Banner image must be a valid URL"); }
  }),
  body("startDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  body("deadline")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Deadline must be a valid ISO 8601 date"),
];

const listProjectsValidationRules = [
  query("status")
    .optional()
    .trim()
    .custom((value) => {
      if (!validStatusValue(value)) {
        throw new Error(`Status filter must be one of: ${PROJECT_STATUS_VALUES.join(", ")}`);
      }
      return true;
    }),
  query("priority")
    .optional()
    .trim()
    .custom((value) => {
      if (!validPriorityValue(value)) {
        throw new Error(`Priority filter must be one of: ${PROJECT_PRIORITY_VALUES.join(", ")}`);
      }
      return true;
    }),
  query("search").optional().trim().isString().withMessage("Search must be a string"),
  query("includeArchived")
    .optional()
    .isBoolean()
    .withMessage("includeArchived must be a boolean"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("sortBy")
    .optional()
    .trim()
    .isIn(["createdAt", "updatedAt", "title", "startDate", "deadline", "status", "priority"])
    .withMessage("sortBy must be one of: createdAt, updatedAt, title, startDate, deadline, status, priority"),
  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Order must be asc or desc"),
];

const assignMemberValidationRules = [
  body("userId").trim().notEmpty().withMessage("userId is required"),
  body("role")
    .optional({ nullable: true })
    .trim()
    .custom((value) => {
      if (!value) {return true;}
      const normalized = String(value).trim().toUpperCase();
      if (!["OWNER", "MANAGER", "MEMBER"].includes(normalized)) {
        throw new Error("Role must be one of: OWNER, MANAGER, MEMBER");
      }
      return true;
    }),
];

const projectFileIdParamValidationRules = [
  param("fileId").trim().notEmpty().withMessage("fileId is required"),
];

const memberIdParamValidationRules = [
  param("memberId").trim().notEmpty().withMessage("memberId is required"),
];

const updateMemberRoleValidationRules = [
  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .custom((value) => {
      const normalized = String(value || "").trim().toUpperCase();
      if (!["MANAGER", "MEMBER"].includes(normalized)) {
        throw new Error("Role must be one of: MANAGER, MEMBER");
      }
      return true;
    }),
];

module.exports = {
  createProjectValidationRules,
  updateProjectValidationRules,
  listProjectsValidationRules,
  assignMemberValidationRules,
  memberIdParamValidationRules,
  projectFileIdParamValidationRules,
  updateMemberRoleValidationRules,
};
