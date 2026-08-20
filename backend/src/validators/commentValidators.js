const { body, param } = require("express-validator");

const createCommentValidationRules = [
  param("id").trim().notEmpty().withMessage("Post id is required"),
  body("content").trim().notEmpty().withMessage("Comment content is required").isLength({ max: 2000 }).withMessage("Comment must be 2000 characters or fewer"),
  body("parentId").optional().isString().withMessage("parentId must be a string"),
];

const updateCommentValidationRules = [
  param("id").trim().notEmpty().withMessage("Comment id is required"),
  body("content").trim().notEmpty().withMessage("Comment content is required").isLength({ max: 2000 }).withMessage("Comment must be 2000 characters or fewer"),
];

const idParamValidationRules = [param("id").trim().notEmpty().withMessage("id is required")];

module.exports = { createCommentValidationRules, updateCommentValidationRules, idParamValidationRules };
