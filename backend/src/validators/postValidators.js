const { body, param } = require("express-validator");

const createPostValidationRules = [
  body("content").optional().isString().isLength({ max: 5000 }).withMessage("Content must be 5000 characters or fewer"),
  body("images").optional().isArray().withMessage("Images must be an array of URLs"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body().custom((value, { req }) => {
    const hasContent = req.body.content && req.body.content.trim();
    const hasImages = Array.isArray(req.body.images) && req.body.images.length > 0;
    if (!hasContent && !hasImages) {
      throw new Error("Either content or images are required");
    }
    return true;
  }),
  body("visibility").optional().isIn(["PUBLIC", "FOLLOWERS", "PRIVATE"]).withMessage("Invalid visibility"),
  body("communityId").optional().isString().withMessage("communityId must be a string"),
];

const updatePostValidationRules = [
  param("id").trim().notEmpty().withMessage("Post id is required"),
  body("content").optional().isString().isLength({ max: 5000 }).withMessage("Content must be 5000 characters or fewer"),
  body("images").optional().isArray().withMessage("Images must be an array of URLs"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("visibility").optional().isIn(["PUBLIC", "FOLLOWERS", "PRIVATE"]).withMessage("Invalid visibility"),
];

const idParamValidationRules = [param("id").trim().notEmpty().withMessage("id is required")];

module.exports = { createPostValidationRules, updatePostValidationRules, idParamValidationRules };
