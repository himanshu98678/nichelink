const {
  createCommunity,
  listCommunities,
  getCommunityById,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  inviteCommunityMember,
  acceptCommunityInvite,
  rejectCommunityInvite,
  getCommunityMembers,
  createPostInCommunity,
  listPostsForCommunity,
  removeCommunityMember,
  updateCommunityMemberRole,
} = require("../services/communityService");

const createCommunityController = async (req, res, next) => {
  try {
    const community = await createCommunity(req.user.id, req.body);
    res.status(201).json({ success: true, message: "Community created successfully", community });
  } catch (error) {
    next(error);
  }
};

const listCommunitiesController = async (req, res, next) => {
  try {
    const communities = await listCommunities(req.user.id);
    res.status(200).json({ success: true, communities });
  } catch (error) {
    next(error);
  }
};

const getCommunityController = async (req, res, next) => {
  try {
    const community = await getCommunityById(req.user.id, req.params.communityId);
    res.status(200).json({ success: true, community });
  } catch (error) {
    next(error);
  }
};

const updateCommunityController = async (req, res, next) => {
  try {
    const community = await updateCommunity(req.user.id, req.params.communityId, req.body);
    res.status(200).json({ success: true, message: "Community updated successfully", community });
  } catch (error) {
    next(error);
  }
};

const deleteCommunityController = async (req, res, next) => {
  try {
    await deleteCommunity(req.user.id, req.params.communityId);
    res.status(200).json({ success: true, message: "Community deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const joinCommunityController = async (req, res, next) => {
  try {
    const community = await joinCommunity(req.user.id, req.params.communityId);
    res.status(200).json({ success: true, message: "Joined community successfully", community });
  } catch (error) {
    next(error);
  }
};

const leaveCommunityController = async (req, res, next) => {
  try {
    await leaveCommunity(req.user.id, req.params.communityId);
    res.status(200).json({ success: true, message: "Left community successfully" });
  } catch (error) {
    next(error);
  }
};

const inviteMemberController = async (req, res, next) => {
  try {
    const invite = await inviteCommunityMember(req.user.id, req.params.communityId, req.body.email);
    res.status(200).json({ success: true, message: "Community invite created successfully", invite });
  } catch (error) {
    next(error);
  }
};

const acceptInviteController = async (req, res, next) => {
  try {
    await acceptCommunityInvite(req.user.id, req.params.inviteId);
    res.status(200).json({ success: true, message: "Community invite accepted" });
  } catch (error) {
    next(error);
  }
};

const rejectInviteController = async (req, res, next) => {
  try {
    await rejectCommunityInvite(req.user.id, req.params.inviteId);
    res.status(200).json({ success: true, message: "Community invite rejected" });
  } catch (error) {
    next(error);
  }
};

const listCommunityMembersController = async (req, res, next) => {
  try {
    const members = await getCommunityMembers(req.user.id, req.params.communityId);
    res.status(200).json({ success: true, members });
  } catch (error) {
    next(error);
  }
};

const removeCommunityMemberController = async (req, res, next) => {
  try {
    await removeCommunityMember(req.user.id, req.params.communityId, req.params.memberId);
    res.status(200).json({ success: true, message: "Community member removed successfully" });
  } catch (error) {
    next(error);
  }
};

const updateCommunityMemberRoleController = async (req, res, next) => {
  try {
    const member = await updateCommunityMemberRole(req.user.id, req.params.communityId, req.params.memberId, req.body.role);
    res.status(200).json({ success: true, message: "Community member role updated successfully", member });
  } catch (error) {
    next(error);
  }
};

const createCommunityPostController = async (req, res, next) => {
  try {
    const post = await createPostInCommunity(req.user.id, req.params.communityId, req.body);
    res.status(201).json({ success: true, message: "Post created successfully", post });
  } catch (error) {
    next(error);
  }
};

const listCommunityPostsController = async (req, res, next) => {
  try {
    const posts = await listPostsForCommunity(req.user.id, req.params.communityId);
    res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCommunity: createCommunityController,
  listCommunities: listCommunitiesController,
  getCommunity: getCommunityController,
  updateCommunity: updateCommunityController,
  deleteCommunity: deleteCommunityController,
  joinCommunity: joinCommunityController,
  leaveCommunity: leaveCommunityController,
  inviteMember: inviteMemberController,
  acceptInvite: acceptInviteController,
  rejectInvite: rejectInviteController,
  listCommunityMembers: listCommunityMembersController,
  removeCommunityMember: removeCommunityMemberController,
  updateCommunityMemberRole: updateCommunityMemberRoleController,
  createCommunityPost: createCommunityPostController,
  listCommunityPosts: listCommunityPostsController,
};
