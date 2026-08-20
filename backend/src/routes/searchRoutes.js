const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth");
const optionalAuth = require("../middlewares/optionalAuth");
const validateRequest = require("../middlewares/validateRequest");
const searchController = require("../controllers/searchController");
const {
  searchValidationRules,
  suggestionValidationRules,
  trendingValidationRules,
} = require("../validators/searchValidators");

router.get("/", optionalAuth, ...searchValidationRules, validateRequest, searchController.search);
router.get(
  "/suggestions",
  optionalAuth,
  ...suggestionValidationRules,
  validateRequest,
  searchController.suggestions
);
router.get("/recent", authenticate, searchController.recentSearches);
router.delete("/recent", authenticate, searchController.clearRecentSearches);
router.get("/trending", optionalAuth, ...trendingValidationRules, validateRequest, searchController.trending);

module.exports = router;
