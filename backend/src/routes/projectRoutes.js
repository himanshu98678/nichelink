const express = require("express");
const router = express.Router();

const { create, list, getById, update, remove, assignMember, archive, restore, removeMember, stats, listMembers, updateMemberRole, dashboard } = require("../controllers/projectController");
const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");
const {
  createProjectValidationRules,
  updateProjectValidationRules,
  listProjectsValidationRules,
  assignMemberValidationRules,
  memberIdParamValidationRules,
  updateMemberRoleValidationRules,
} = require("../validators/projectValidators");

router.post("/", authenticate, ...createProjectValidationRules, validateRequest, create);
router.get("/", authenticate, ...listProjectsValidationRules, validateRequest, list);
router.get("/:projectId", authenticate, getById);
router.put("/:projectId", authenticate, ...updateProjectValidationRules, validateRequest, update);
router.delete("/:projectId", authenticate, remove);
router.post("/:projectId/members", authenticate, ...assignMemberValidationRules, validateRequest, assignMember);
router.get("/:projectId/members", authenticate, listMembers);
router.put(
  "/:projectId/members/:memberId",
  authenticate,
  ...memberIdParamValidationRules,
  ...updateMemberRoleValidationRules,
  validateRequest,
  updateMemberRole,
);
router.post("/:projectId/archive", authenticate, archive);
router.post("/:projectId/restore", authenticate, restore);
router.delete(
  "/:projectId/members/:memberId",
  authenticate,
  ...memberIdParamValidationRules,
  validateRequest,
  removeMember,
);
router.get("/:projectId/stats", authenticate, stats);
router.get("/:projectId/dashboard", authenticate, dashboard);

module.exports = router;
