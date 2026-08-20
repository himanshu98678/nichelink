const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const communityService = require("./communityService");
const messageService = require("./messageService");
const socketService = require("./socketService");

const channelInclude = {
  community: { select: { id: true, name: true, visibility: true } },
  conversation: { select: { id: true } },
};

const ensureDefaultChannel = async (communityId) => {
  const existing = await prisma.communityChannel.findUnique({ where: { communityId_slug: { communityId, slug: "general" } }, include: channelInclude });
  if (existing) { return existing; }
  try {
    return await prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({ data: { isGroup: true, name: "General" } });
      return tx.communityChannel.create({ data: { communityId, conversationId: conversation.id, name: "General", slug: "general" }, include: channelInclude });
    });
  } catch (error) {
    if (error.code === "P2002") {
      return prisma.communityChannel.findUnique({ where: { communityId_slug: { communityId, slug: "general" } }, include: channelInclude });
    }
    throw error;
  }
};

const getChannel = async (channelId) => {
  const channel = await prisma.communityChannel.findUnique({ where: { id: channelId }, include: channelInclude });
  if (!channel) { throw new AppError(404, "Community channel not found"); }
  return channel;
};

const ensureChannelMember = async (userId, channelId) => {
  const channel = await getChannel(channelId);
  const member = await prisma.communityMember.findUnique({ where: { communityId_userId: { communityId: channel.communityId, userId } } });
  if (!member) { throw new AppError(403, "Join the community before accessing this channel"); }
  return { channel, member };
};

const listChannels = async (userId, communityId) => {
  await communityService.ensureCommunityAccess(userId, communityId);
  await ensureDefaultChannel(communityId);
  const [community, channels, member] = await Promise.all([
    prisma.community.findUnique({ where: { id: communityId }, select: { id: true, name: true, visibility: true } }),
    prisma.communityChannel.findMany({ where: { communityId }, include: channelInclude, orderBy: { createdAt: "asc" } }),
    prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId } } }),
  ]);
  return { community, channels, isMember: Boolean(member) };
};

const joinChannel = async (userId, channelId) => {
  const channel = await getChannel(channelId);
  if (channel.community.visibility === "private") {
    const access = await communityService.ensureCommunityAccess(userId, channel.communityId);
    if (!access.members.some((member) => member.userId === userId)) { throw new AppError(403, "Private community membership is required"); }
  }
  const member = await prisma.communityMember.upsert({
    where: { communityId_userId: { communityId: channel.communityId, userId } },
    create: { communityId: channel.communityId, userId, role: "MEMBER" },
    update: {},
  });
  socketService.joinUserSocketsToRoom(userId, `conversation:${channel.conversationId}`);
  socketService.toConversation(channel.conversationId, "community:member:joined", { channelId, userId });
  return { channel, member };
};

const leaveChannel = async (userId, channelId) => {
  const { channel, member } = await ensureChannelMember(userId, channelId);
  if (member.role === "OWNER") { throw new AppError(400, "Community owners cannot leave their community"); }
  await prisma.communityMember.delete({ where: { id: member.id } });
  socketService.leaveUserSocketsFromRoom(userId, `conversation:${channel.conversationId}`);
  socketService.toConversation(channel.conversationId, "community:member:left", { channelId, userId });
};

const listMessages = async (userId, channelId, options) => {
  const { channel } = await ensureChannelMember(userId, channelId);
  return messageService.listMessages(userId, channel.conversationId, options);
};

const sendMessage = async (userId, channelId, data) => {
  const { channel } = await ensureChannelMember(userId, channelId);
  const message = await messageService.sendMessage(userId, { ...data, conversationId: channel.conversationId, attachments: [] });
  socketService.toConversation(channel.conversationId, "community:message:new", { channelId, message });
  return message;
};

const editMessage = async (userId, channelId, messageId, content) => {
  const { channel } = await ensureChannelMember(userId, channelId);
  const message = await prisma.message.findUnique({ where: { id: messageId }, select: { conversationId: true } });
  if (!message || message.conversationId !== channel.conversationId) { throw new AppError(404, "Community message not found"); }
  return messageService.editMessage(userId, messageId, content);
};

const deleteMessage = async (userId, channelId, messageId) => {
  const { channel } = await ensureChannelMember(userId, channelId);
  const message = await prisma.message.findUnique({ where: { id: messageId }, select: { conversationId: true } });
  if (!message || message.conversationId !== channel.conversationId) { throw new AppError(404, "Community message not found"); }
  return messageService.deleteMessage(userId, messageId);
};

module.exports = { getChannel, ensureChannelMember, listChannels, joinChannel, leaveChannel, listMessages, sendMessage, editMessage, deleteMessage };