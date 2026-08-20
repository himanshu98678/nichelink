const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");

const jobController = require("../controllers/jobController");
const applicationController = require("../controllers/applicationController");
const savedJobController = require("../controllers/savedJobController");

const {
  createJobRules,
  updateJobRules,
  applyJobRules,
  jobSearchQueryRules,
  updateApplicationStatusRules,
  idParamRules,
} = require("../validators/jobValidators");

// 1. Job CRUD & List
router.post("/jobs", authenticate, ...createJobRules, validateRequest, jobController.create);
router.get("/jobs", ...jobSearchQueryRules, validateRequest, jobController.list);
router.get("/jobs/:id", ...idParamRules, validateRequest, jobController.getOne);
router.patch("/jobs/:id", authenticate, ...idParamRules, ...updateJobRules, validateRequest, jobController.update);
router.delete("/jobs/:id", authenticate, ...idParamRules, validateRequest, jobController.remove);

// 2. Job Applications
router.post("/jobs/:id/apply", authenticate, ...idParamRules, ...applyJobRules, validateRequest, applicationController.apply);
router.delete("/jobs/:id/apply", authenticate, ...idParamRules, validateRequest, applicationController.withdraw);
router.get("/jobs/:id/applications", authenticate, ...idParamRules, ...jobSearchQueryRules, validateRequest, applicationController.list);
router.get("/applications", authenticate, ...jobSearchQueryRules, validateRequest, applicationController.list);
router.get("/applications/:id", authenticate, ...idParamRules, validateRequest, applicationController.getDetails);
router.patch("/applications/:id/status", authenticate, ...idParamRules, ...updateApplicationStatusRules, validateRequest, applicationController.updateStatus);

// 3. Saved Jobs
router.post("/jobs/:id/save", authenticate, ...idParamRules, validateRequest, savedJobController.save);
router.delete("/jobs/:id/save", authenticate, ...idParamRules, validateRequest, savedJobController.unsave);
router.get("/saved-jobs", authenticate, ...jobSearchQueryRules, validateRequest, savedJobController.list);

module.exports = router;
