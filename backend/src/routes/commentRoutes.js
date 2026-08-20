const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");

const commentController = require("../controllers/commentController");
const { updateCommentValidationRules, idParamValidationRules } = require("../validators/commentValidators");

router.patch("/:id", authenticate, ...updateCommentValidationRules, validateRequest, commentController.update);
router.delete("/:id", authenticate, ...idParamValidationRules, validateRequest, commentController.remove);
router.post("/:id/reply", authenticate, ...updateCommentValidationRules, validateRequest, commentController.reply);

module.exports = router;
