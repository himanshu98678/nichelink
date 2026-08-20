const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");
const reportController = require("../controllers/reportController");
const { reportCreateValidationRules, reportListValidationRules } = require("../validators/adminValidators");

router.post("/", authenticate, ...reportCreateValidationRules, validateRequest, reportController.createReport);
router.get("/", authenticate, ...reportListValidationRules, validateRequest, reportController.listReports);

module.exports = router;
