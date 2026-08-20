const { body, param } = require("express-validator");

const createCommunityValidationRules = [
  body("name").trim().notEmpty().withMessage("Community name is required"),
  body("description").optional().trim().isLength({ max: 1000 }).withMessage("Description must be 1000 characters or fewer"),
  body("coverImage").optional({ nullable: true }).custom((value) => {
    try { new URL(value); return true; } catch { throw new Error("Cover image must be a valid URL"); }
  }),
  body("visibility")
    .optional()
    .trim()
    .isIn(["public", "private"])
    .withMessage("Visibility must be public or private"),
];

const updateCommunityValidationRules = [
  body("name").optional().trim().notEmpty().withMessage("Community name cannot be empty"),
  body("description").optional().trim().isLength({ max: 1000 }).withMessage("Description must be 1000 characters or fewer"),
  body("coverImage").optional({ nullable: true }).custom((value) => {
    try { new URL(value); return true; } catch { throw new Error("Cover image must be a valid URL"); }
  }),
  body("visibility")
    .optional()
    .trim()
    .isIn(["public", "private"])
    .withMessage("Visibility must be public or private"),
];

const inviteMemberValidationRules = [
  body("email").trim().notEmpty().withMessage("Invite email is required").isEmail().withMessage("Invite email must be valid"),
];

const updateCommunityMemberRoleValidationRules = [
  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["MEMBER", "MODERATOR"])
    .withMessage("Role must be MEMBER or MODERATOR"),
];

const communityIdParamRules = [
  param("communityId").trim().notEmpty().withMessage("Community ID is required"),
];

const inviteIdParamRules = [
  param("inviteId").trim().notEmpty().withMessage("Invite ID is required"),
];

const memberIdParamRules = [
  param("memberId").trim().notEmpty().withMessage("Member ID is required"),
];

const createCommunityPostValidationRules = [
  body("title").trim().notEmpty().withMessage("Post title is required"),
  body("content").trim().notEmpty().withMessage("Post content is required"),
];

module.exports = {
  createCommunityValidationRules,
  updateCommunityValidationRules,
  inviteMemberValidationRules,
  createCommunityPostValidationRules,
  updateCommunityMemberRoleValidationRules,
  communityIdParamRules,
  inviteIdParamRules,
  memberIdParamRules,
};
