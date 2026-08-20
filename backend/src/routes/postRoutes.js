const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth");
const optionalAuth = require("../middlewares/optionalAuth");
const validateRequest = require("../middlewares/validateRequest");

const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");

const { createPostValidationRules, updatePostValidationRules, idParamValidationRules } = require("../validators/postValidators");
const { createCommentValidationRules } = require("../validators/commentValidators");

// Posts
router.post("/", authenticate, ...createPostValidationRules, validateRequest, postController.create);
router.get("/", optionalAuth, postController.list);
router.get("/saved", authenticate, postController.listSaved);
router.get("/:id", authenticate, ...idParamValidationRules, validateRequest, postController.getById);
router.patch("/:id", authenticate, ...updatePostValidationRules, validateRequest, postController.update);
router.delete("/:id", authenticate, ...idParamValidationRules, validateRequest, postController.remove);

// Likes
router.post("/:id/like", authenticate, ...idParamValidationRules, validateRequest, postController.like);
router.delete("/:id/like", authenticate, ...idParamValidationRules, validateRequest, postController.removeLike);

// Saves
router.post("/:id/save", authenticate, ...idParamValidationRules, validateRequest, postController.save);
router.delete("/:id/save", authenticate, ...idParamValidationRules, validateRequest, postController.removeSave);

// Share
router.post("/:id/share", authenticate, ...idParamValidationRules, validateRequest, postController.share);

// Comments on posts
router.post("/:id/comments", authenticate, ...createCommentValidationRules, validateRequest, commentController.create);
router.get("/:id/comments", authenticate, ...idParamValidationRules, validateRequest, commentController.list);

module.exports = router;
