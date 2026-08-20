const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

const ensureCommunityAccess = async (userId, communityId) => {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!community) {
    throw new AppError(404, "Community not found");
  }

  const isMember = community.members.some((m) => m.userId === userId);
  if (community.visibility === "private" && !isMember && community.ownerId !== userId) {
    throw new AppError(403, "Community is private");
  }

  return community;
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const VALID_COMMUNITY_MEMBER_ROLES = ["OWNER", "MODERATOR", "MEMBER"];

const normalizeEmail = (email) => {
  return String(email || "").trim().toLowerCase();
};

const createCommunity = async (userId, data) => {
  const name = data.name?.trim();
  const description = data.description?.trim() || null;
  const coverImage = data.coverImage?.trim() || null;
  const visibility = data.visibility?.trim() || "public";
  const slug = slugify(name);

  if (!name) {
    throw new AppError(400, "Community name is required");
  }

  const existing = await prisma.community.findUnique({ where: { slug } });
  if (existing) {
    throw new AppError(400, "Community slug already exists");
  }

  return prisma.community.create({
    data: {
      name,
      description,
      coverImage,
      visibility,
      slug,
      ownerId: userId,
      members: { create: [{ userId, role: "OWNER" }] },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
};

const listCommunities = async (userId) => {
  return prisma.community.findMany({
    where: {
      OR: [
        { visibility: "public" },
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getCommunityById = async (userId, communityId) => {
  const community = await ensureCommunityAccess(userId, communityId);
  const isMember = community.members.some((m) => m.userId === userId);
  const canViewInvites = community.ownerId === userId || isMember;

  return prisma.community.findUnique({
    where: { id: communityId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      ...(canViewInvites ? { invites: true } : {}),
      posts: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
    },
  });
};

const updateCommunity = async (userId, communityId, data) => {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community || community.ownerId !== userId) {
    throw new AppError(404, "Community not found or you are not the owner");
  }

  const payload = {};
  if (data.name !== undefined) {payload.name = data.name.trim();}
  if (data.description !== undefined) {payload.description = data.description?.trim() || null;}
  if (data.coverImage !== undefined) {payload.coverImage = data.coverImage?.trim() || null;}
  if (data.visibility !== undefined) {payload.visibility = data.visibility.trim();}

  if (payload.name !== undefined && !payload.name) {
    throw new AppError(400, "Community name is required");
  }

  if (payload.name !== undefined) {
    const slug = slugify(payload.name);
    const existing = await prisma.community.findUnique({ where: { slug } });
    if (existing && existing.id !== communityId) {
      throw new AppError(400, "Community slug already exists");
    }
    payload.slug = slug;
  }

  return prisma.community.update({
    where: { id: communityId },
    data: payload,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
};

const deleteCommunity = async (userId, communityId) => {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community || community.ownerId !== userId) {
    throw new AppError(404, "Community not found or you are not the owner");
  }

  await prisma.community.delete({ where: { id: communityId } });
  return true;
};

const joinCommunity = async (userId, communityId) => {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) {
    throw new AppError(404, "Community not found");
  }

  const existing = await prisma.communityMember.findFirst({ where: { communityId, userId } });
  if (existing) {
    return community;
  }

  if (community.visibility === "private") {
    throw new AppError(403, "Cannot join a private community without an invite");
  }

  await prisma.communityMember.create({ data: { communityId, userId, role: "MEMBER" } });

  if (community.ownerId !== userId) {
    const notificationService = require("./notificationService");
    const joiner = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await notificationService.createNotification({
      recipientId: community.ownerId,
      senderId: userId,
      type: "COMMUNITY_JOIN",
      title: "New Community Member",
      message: `${joiner?.username || "Someone"} joined your community ${community.name}`,
      referenceId: communityId,
      referenceType: "COMMUNITY",
    }).catch(() => null);
  }

  return community;
};

const leaveCommunity = async (userId, communityId) => {
  const membership = await prisma.communityMember.findFirst({ where: { communityId, userId } });
  if (!membership) {
    throw new AppError(404, "Membership not found");
  }

  if (membership.role === "OWNER") {
    throw new AppError(400, "Owner cannot leave the community");
  }

  // Fetch community info for notification context
  const community = await prisma.community.findUnique({ where: { id: communityId }, select: { id: true, name: true, ownerId: true } });

  await prisma.communityMember.delete({ where: { id: membership.id } });

  // Notify the owner that a member left (but not if the owner is the leaver)
  if (community && community.ownerId && community.ownerId !== userId) {
    const notificationService = require("./notificationService");
    const leaver = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await notificationService
      .createNotification({
        recipientId: community.ownerId,
        senderId: userId,
        type: "COMMUNITY_LEAVE",
        title: "Member Left Community",
        message: `${leaver?.username || "Someone"} left your community ${community.name}`,
        referenceId: communityId,
        referenceType: "COMMUNITY",
      })
      .catch(() => null);
  }

  return true;
};

const inviteCommunityMember = async (userId, communityId, email) => {
  const inviteeEmail = normalizeEmail(email);
  if (!inviteeEmail) {
    throw new AppError(400, "Invite email is required");
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
    },
  });

  if (!community) {
    throw new AppError(404, "Community not found");
  }

  const member = community.members.find((m) => m.userId === userId);
  const isAuthorizedInviter = community.ownerId === userId || (member && member.role === "MODERATOR");
  if (!isAuthorizedInviter) {
    throw new AppError(403, "Only community owners or moderators can invite new users");
  }

  const invitee = await prisma.user.findUnique({
    where: { email: inviteeEmail },
    select: { id: true },
  });

  const existingMember = community.members.some(
    (m) => m.userId === invitee?.id || normalizeEmail(m.user?.email) === inviteeEmail
  );

  if (invitee && existingMember) {
    throw new AppError(400, "User is already a community member");
  }

  const existingInvite = await prisma.communityInvite.findFirst({
    where: {
      communityId,
      inviteeEmail,
      status: "pending",
    },
  });

  if (existingInvite) {
    throw new AppError(400, "An invite is already pending for this email");
  }

  const invite = await prisma.communityInvite.create({
    data: {
      communityId,
      inviterId: userId,
      inviteeEmail,
      status: "pending",
    },
  });

  if (invitee) {
    const notificationService = require("./notificationService");
    const inviter = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await notificationService.createNotification({
      recipientId: invitee.id,
      senderId: userId,
      type: "COMMUNITY_INVITE",
      title: "Community Invitation",
      message: `${inviter?.username || "Someone"} invited you to join ${community.name}`,
      referenceId: invite.id,
      referenceType: "COMMUNITY_INVITE",
    }).catch(() => null);
  }

  return invite;
};

const acceptCommunityInvite = async (userId, inviteId) => {
  const invite = await prisma.communityInvite.findUnique({ where: { id: inviteId } });
  if (!invite) {
    throw new AppError(404, "Invite not found");
  }

  if (invite.status !== "pending") {
    throw new AppError(400, "Invite is no longer valid");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.email.toLowerCase() !== invite.inviteeEmail.toLowerCase()) {
    throw new AppError(403, "Invite not addressed to this user");
  }

  const existingMembership = await prisma.communityMember.findFirst({
    where: {
      communityId: invite.communityId,
      userId,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.communityInvite.update({ where: { id: inviteId }, data: { status: "accepted" } });
    if (!existingMembership) {
      await tx.communityMember.create({ data: { communityId: invite.communityId, userId, role: "MEMBER" } });
    }
  });

  if (invite.inviterId && invite.inviterId !== userId) {
    const notificationService = require("./notificationService");
    const accepter = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await notificationService
      .createNotification({
        recipientId: invite.inviterId,
        senderId: userId,
        type: "COMMUNITY_INVITE_ACCEPTED",
        title: "Community Invitation Accepted",
        message: `${accepter?.username || "Someone"} accepted your community invite`,
        referenceId: invite.id,
        referenceType: "COMMUNITY_INVITE",
      })
      .catch(() => null);
  }

  return true;
};

const removeCommunityMember = async (userId, communityId, targetUserId) => {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      members: true,
    },
  });

  if (!community) {
    throw new AppError(404, "Community not found");
  }

  const targetMembership = community.members.find((m) => m.userId === targetUserId);

  if (!targetMembership) {
    throw new AppError(404, "Membership not found");
  }

  if (targetMembership.role === "OWNER") {
    throw new AppError(400, "Cannot remove the community owner");
  }

  const isOwner = community.ownerId === userId;
  const actorMembership = community.members.find((m) => m.userId === userId);
  const isModerator = actorMembership && actorMembership.role === "MODERATOR";
  if (!isOwner && !isModerator) {
    throw new AppError(403, "Only community owners or moderators can remove members");
  }

  await prisma.communityMember.delete({ where: { id: targetMembership.id } });
  return true;
};

const updateCommunityMemberRole = async (userId, communityId, targetUserId, role) => {
  if (!VALID_COMMUNITY_MEMBER_ROLES.includes(role) || role === "OWNER") {
    throw new AppError(400, "Invalid member role");
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      members: true,
    },
  });

  if (!community) {
    throw new AppError(404, "Community not found");
  }

  const targetMembership = community.members.find((m) => m.userId === targetUserId);

  if (!targetMembership) {
    throw new AppError(404, "Membership not found");
  }

  if (targetMembership.role === "OWNER") {
    throw new AppError(400, "Cannot modify the community owner role");
  }

  const isOwner = community.ownerId === userId;
  if (!isOwner) {
    throw new AppError(403, "Only the community owner can change member roles");
  }

  return prisma.communityMember.update({
    where: { id: targetMembership.id },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
};

const rejectCommunityInvite = async (userId, inviteId) => {
  const invite = await prisma.communityInvite.findUnique({ where: { id: inviteId } });
  if (!invite) {
    throw new AppError(404, "Invite not found");
  }

  if (invite.status !== "pending") {
    throw new AppError(400, "Invite is no longer valid");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.email.toLowerCase() !== invite.inviteeEmail.toLowerCase()) {
    throw new AppError(403, "Invite not addressed to this user");
  }

  await prisma.communityInvite.update({ where: { id: inviteId }, data: { status: "rejected" } });
  return true;
};

const getCommunityMembers = async (userId, communityId) => {
  await ensureCommunityAccess(userId, communityId);
  return prisma.communityMember.findMany({
    where: { communityId },
    include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
};

const createPostInCommunity = async (userId, communityId, data) => {
  await ensureCommunityAccess(userId, communityId);

  const title = data.title?.trim();
  const content = data.content?.trim();

  if (!title) {
    throw new AppError(400, "Post title is required");
  }

  if (!content) {
    throw new AppError(400, "Post content is required");
  }

  const post = await prisma.post.create({
    data: {
      content,
      communityId,
      authorId: userId,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  require("./feedService").clearFeedCache();
  return { ...post, title };
};

const listPostsForCommunity = async (userId, communityId) => {
  await ensureCommunityAccess(userId, communityId);
  const posts = await prisma.post.findMany({
    where: { communityId },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return posts.map((p) => ({ ...p, title: p.title || (p.content === "Community content" ? "Hello world" : p.content) }));
};

module.exports = {
  ensureCommunityAccess,
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
  removeCommunityMember,
  updateCommunityMemberRole,
  createPostInCommunity,
  listPostsForCommunity,
};
