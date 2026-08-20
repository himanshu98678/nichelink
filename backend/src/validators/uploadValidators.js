const { body, param, query } = require("express-validator");

const uploadFileValidationRules = [
  body("category").optional().isString().trim().isLength({ max: 50 }).withMessage("Category must be 50 characters or fewer"),
  body("referenceId").optional().isString().trim().isLength({ max: 100 }).withMessage("Reference ID must be 100 characters or fewer"),
  body("folder")
    .optional()
    .isString()
    .trim()
    .matches(/^[a-zA-Z0-9_\-]+$/)
    .withMessage("Folder must contain only letters, numbers, underscores, or hyphens"),
  body("visibility")
    .optional()
    .isIn(["PUBLIC", "PRIVATE"])
    .withMessage("Visibility must be PUBLIC or PRIVATE"),
  body("metadata")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (parsed === null || (typeof parsed !== "object" && !Array.isArray(parsed))) {
            throw new Error("Metadata must be a JSON object or array");
          }
          return true;
        } catch {
          throw new Error("Metadata must be valid JSON");
        }
      }
      if (typeof value === "object") {
        return true;
      }
      throw new Error("Metadata must be a JSON object or array");
    }),
];

const listFilesValidationRules = [
  query("category").optional().isString().trim(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

const fileIdParamRules = [
  param("id").trim().notEmpty().withMessage("File ID is required"),
];

module.exports = {
  uploadFileValidationRules,
  listFilesValidationRules,
  fileIdParamRules,
};
