const express = require("express");
const router = express.Router();

const { assignRole, fetchUserRoles } = require("../controllers/roleController");
const authenticate = require("../middlewares/auth");
const { authorizeRoles } = require("../middlewares/authorize");
const { roleValidationRules } = require("../validators/authValidators");
const validateRequest = require("../middlewares/validateRequest");

router.post("/assign", authenticate, authorizeRoles("ADMIN", "SUPER_ADMIN"), ...roleValidationRules, validateRequest, assignRole);
router.get("/:userId", authenticate, authorizeRoles("ADMIN", "SUPER_ADMIN"), fetchUserRoles);

module.exports = router;
