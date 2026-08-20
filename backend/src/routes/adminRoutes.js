const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth");
const { authorizeRoles } = require("../middlewares/authorize");
const validateRequest = require("../middlewares/validateRequest");
const adminController = require("../controllers/adminController");
const {
  userListValidationRules,
  communityListValidationRules,
  postListValidationRules,
  commentListValidationRules,
  jobListValidationRules,
  projectListValidationRules,
  reportListValidationRules,
  reportResolutionRules,
  idParamRules,
} = require("../validators/adminValidators");

router.use(authenticate, authorizeRoles("ADMIN", "SUPER_ADMIN"));

router.get("/dashboard", adminController.dashboard);
router.get("/analytics", adminController.analytics);
router.get("/users", ...userListValidationRules, validateRequest, adminController.listUsers);
router.get("/users/:id", ...idParamRules, validateRequest, adminController.getUser);
router.get("/communities", ...communityListValidationRules, validateRequest, adminController.listCommunities);
router.get("/posts", ...postListValidationRules, validateRequest, adminController.listPosts);
router.get("/comments", ...commentListValidationRules, validateRequest, adminController.listComments);
router.get("/jobs", ...jobListValidationRules, validateRequest, adminController.listJobs);
router.get("/projects", ...projectListValidationRules, validateRequest, adminController.listProjects);
router.get("/reports", ...reportListValidationRules, validateRequest, adminController.listReports);
router.patch("/reports/:id/resolve", ...idParamRules, ...reportResolutionRules, validateRequest, adminController.resolveReport);
router.delete("/users/:id", ...idParamRules, validateRequest, adminController.deleteUser);
router.delete("/communities/:id", ...idParamRules, validateRequest, adminController.deleteCommunity);
router.delete("/posts/:id", ...idParamRules, validateRequest, adminController.deletePost);
router.delete("/comments/:id", ...idParamRules, validateRequest, adminController.deleteComment);
router.delete("/jobs/:id", ...idParamRules, validateRequest, adminController.deleteJob);
router.delete("/projects/:id", ...idParamRules, validateRequest, adminController.deleteProject);

module.exports = router;
