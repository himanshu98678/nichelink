const express = require("express");
const router = express.Router();

const optionalAuth = require("../middlewares/optionalAuth");
const validateRequest = require("../middlewares/validateRequest");

const feedController = require("../controllers/feedController");
const {
  feedQueryValidationRules,
  communityFeedValidationRules,
  userFeedValidationRules,
  searchFeedValidationRules,
} = require("../validators/feedValidators");

// GET /feed
router.get("/feed", optionalAuth, ...feedQueryValidationRules, validateRequest, feedController.getHomeFeed);

// GET /feed/latest
router.get("/feed/latest", optionalAuth, ...feedQueryValidationRules, validateRequest, feedController.getLatestFeed);

// GET /feed/following
router.get("/feed/following", optionalAuth, ...feedQueryValidationRules, validateRequest, feedController.getFollowingFeed);

// GET /feed/search
router.get("/feed/search", optionalAuth, ...searchFeedValidationRules, validateRequest, feedController.searchFeed);

// GET /communities/:communityId/feed
router.get(
  "/communities/:communityId/feed",
  optionalAuth,
  ...communityFeedValidationRules,
  validateRequest,
  feedController.getCommunityFeed
);

// GET /users/:userId/feed
router.get(
  "/users/:userId/feed",
  optionalAuth,
  ...userFeedValidationRules,
  validateRequest,
  feedController.getUserFeed
);

module.exports = router;
