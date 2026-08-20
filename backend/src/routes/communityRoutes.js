const express = require("express");
const router = express.Router();

const {
  createCommunity,
  listCommunities,
  getCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  inviteMember,
  acceptInvite,
  rejectInvite,
  listCommunityMembers,
  removeCommunityMember,
  updateCommunityMemberRole,
  createCommunityPost,
  listCommunityPosts,
} = require("../controllers/communityController");
const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");
const {
  createCommunityValidationRules,
  updateCommunityValidationRules,
  inviteMemberValidationRules,
  createCommunityPostValidationRules,
  updateCommunityMemberRoleValidationRules,
  communityIdParamRules,
  inviteIdParamRules,
  memberIdParamRules,
} = require("../validators/communityValidators");

router.post("/", authenticate, ...createCommunityValidationRules, validateRequest, createCommunity);
router.get("/", authenticate, listCommunities);
router.get("/:communityId", authenticate, ...communityIdParamRules, validateRequest, getCommunity);
router.put("/:communityId", authenticate, ...communityIdParamRules, ...updateCommunityValidationRules, validateRequest, updateCommunity);
router.delete("/:communityId", authenticate, ...communityIdParamRules, validateRequest, deleteCommunity);
router.post("/:communityId/join", authenticate, ...communityIdParamRules, validateRequest, joinCommunity);
router.post(
  "/:communityId/leave",
  authenticate,
  ...communityIdParamRules,
  validateRequest,
  leaveCommunity
);
router.post(
  "/:communityId/invite",
  authenticate,
  ...communityIdParamRules,
  ...inviteMemberValidationRules,
  validateRequest,
  inviteMember
);
router.post("/invites/:inviteId/accept", authenticate, ...inviteIdParamRules, validateRequest, acceptInvite);
router.post("/invites/:inviteId/reject", authenticate, ...inviteIdParamRules, validateRequest, rejectInvite);
router.get("/:communityId/members", authenticate, ...communityIdParamRules, validateRequest, listCommunityMembers);
router.delete(
  "/:communityId/members/:memberId",
  authenticate,
  ...communityIdParamRules,
  ...memberIdParamRules,
  validateRequest,
  removeCommunityMember
);
router.patch(
  "/:communityId/members/:memberId/role",
  authenticate,
  ...communityIdParamRules,
  ...memberIdParamRules,
  ...updateCommunityMemberRoleValidationRules,
  validateRequest,
  updateCommunityMemberRole
);
router.post(
  "/:communityId/posts",
  authenticate,
  ...communityIdParamRules,
  ...createCommunityPostValidationRules,
  validateRequest,
  createCommunityPost
);
router.get("/:communityId/posts", authenticate, listCommunityPosts);

module.exports = router;
