const express = require("express");
const authenticate = require("../middlewares/auth");
const subscriptionController = require("../controllers/subscriptionController");

const router = express.Router();

router.get("/plans", authenticate, subscriptionController.plans);
router.get("/subscription", authenticate, subscriptionController.current);
router.get("/invoices", authenticate, subscriptionController.invoices);
router.post("/checkout", authenticate, subscriptionController.checkout);
router.post("/subscription/cancel", authenticate, subscriptionController.cancel);
router.post("/invoices/:invoiceId/refund", authenticate, subscriptionController.refund);
router.post("/webhook", subscriptionController.webhook);

module.exports = router;