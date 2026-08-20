const express = require("express");
const authenticate = require("../middlewares/auth");
const controller = require("../controllers/dashboardAnalyticsController");

const router = express.Router();
router.get("/dashboard/analytics", authenticate, controller.get);

module.exports = router;