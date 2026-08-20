const express = require("express");
const router = express.Router();

const {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
} = require("../controllers/clientController");
const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");
const {
  createClientValidationRules,
  updateClientValidationRules,
} = require("../validators/clientValidators");

router.post("/", authenticate, ...createClientValidationRules, validateRequest, createClient);
router.get("/", authenticate, getClients);
router.get("/:id", authenticate, getClient);
router.put("/:id", authenticate, ...updateClientValidationRules, validateRequest, updateClient);
router.delete("/:id", authenticate, deleteClient);

module.exports = router;
