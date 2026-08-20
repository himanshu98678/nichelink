const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const socketService = require("./socketService");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Dynamically joins active socket connections of a user to a Socket.IO room
 */
function joinUserSocketsToRoom(userId, roomName) {
  const onlineUsers = socketService.getOnlineUsers();
  const socketIds = onlineUsers.get(userId);
  if (socketIds) {
    socketIds.forEach((sid) => {
      const socket = socketService.getIo()?.sockets.sockets.get(sid);
      if (socket) {
        socket.join(roomName);
      }
    });
  }
}

/**
 * Dynamically removes active socket connections of a user from a Socket.IO room
 */
function leaveUserSocketsFromRoom(userId, roomName) {
  const onlineUsers = socketService.getOnlineUsers();
  const socketIds = onlineUsers.get(userId);
  if (socketIds) {
    socketIds.forEach((sid) => {
      const socket = socketService.getIo()?.sockets.sockets.get(sid);
      if (socket) {
        socket.leave(roomName);
      }
    });
  }
}

/**
 * 1. Create or retrieve direct 1-to-1 conversation
 */
async function createConversation(userId, targetUserId) {
  if (userId === targetUserId) {
    throw new AppError(400, "Cannot start a conversation with yourself");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });
  if (!targetUser) {
    throw new AppError(404, "Target user not found");
  }

  // Check if a 1-to-1 conversation already exists between both users
  let conversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true, isOnline: true } },
        },
      },
    },
  });

  if (conversation) {
    return conversation;
  }

  // Create new conversation
  conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [{ userId }, { userId: targetUserId }],
      },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true, isOnline: true } },
        },
      },
    },
  });

  // Make sure both online users' sockets join the new room in real-time
  joinUserSocketsToRoom(userId, `conversation:${conversation.id}`);
  joinUserSocketsToRoom(targetUserId, `conversation:${conversation.id}`);

  // Broadcast creation event to both users
  socketService.toUser(userId, "conversation:create", conversation);
  socketService.toUser(targetUserId, "conversation:create", conversation);

  return conversation;
}

/**
 * 2. Create Group Conversation
 */
async function createGroup(ownerId, name, memberIds = []) {
  if (!name || !name.trim()) {
    throw new AppError(400, "Group name is required");
  }

  // Ensure unique member IDs and add owner
  const allMemberIds = [...new Set([ownerId, ...memberIds])];

  // Verify all members exist
  const usersCount = await prisma.user.count({
    where: { id: { in: allMemberIds } },
  });
  if (usersCount !== allMemberIds.length) {
    throw new AppError(400, "One or more group members do not exist");
  }

  const group = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: name.trim(),
      ownerId,
      participants: {
        create: allMemberIds.map((uid) => ({ userId: uid })),
      },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true, isOnline: true } },
        },
      },
    },
  });

  // Join online members to the group's socket room
  allMemberIds.forEach((uid) => {
    joinUserSocketsToRoom(uid, `conversation:${group.id}`);
    socketService.toUser(uid, "conversation:create", group);
  });

  return group;
}

/**
 * 3. Rename Group Conversation
 */
async function renameGroup(userId, conversationId, newName, userRole = "USER") {
  if (!newName || !newName.trim()) {
    throw new AppError(400, "Group name cannot be empty");
  }

  const group = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!group || !group.isGroup) {
    throw new AppError(404, "Group conversation not found");
  }

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  if (group.ownerId !== userId && !isAdmin) {
    throw new AppError(403, "Only the group owner or admin can rename the group");
  }

  const updatedGroup = await prisma.conversation.update({
    where: { id: conversationId },
    data: { name: newName.trim() },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true, isOnline: true } },
        },
      },
    },
  });

  socketService.toConversation(conversationId, "conversation:update", updatedGroup);
  return updatedGroup;
}

/**
 * 4. Add Members to Group
 */
async function addMembers(userId, conversationId, memberIds = [], userRole = "USER") {
  const group = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!group || !group.isGroup) {
    throw new AppError(404, "Group conversation not found");
  }

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  if (group.ownerId !== userId && !isAdmin) {
    throw new AppError(403, "Only the group owner or admin can add new members");
  }

  // Verify membership
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!member) {
    throw new AppError(403, "Access denied to group");
  }

  // Filter out existing members
  const existingMembers = await prisma.conversationMember.findMany({
    where: { conversationId, userId: { in: memberIds } },
    select: { userId: true },
  });
  const existingUserIds = existingMembers.map((em) => em.userId);
  const newMemberIds = memberIds.filter((id) => !existingUserIds.includes(id));

  if (newMemberIds.length > 0) {
    // Verify new users exist
    const usersCount = await prisma.user.count({
      where: { id: { in: newMemberIds } },
    });
    if (usersCount !== newMemberIds.length) {
      throw new AppError(400, "One or more new members do not exist");
    }

    await prisma.conversationMember.createMany({
      data: newMemberIds.map((uid) => ({ conversationId, userId: uid })),
    });

    // Join new members' active sockets to the room
    newMemberIds.forEach((uid) => {
      joinUserSocketsToRoom(uid, `conversation:${conversationId}`);
    });
  }

  const updatedGroup = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true, isOnline: true } },
        },
      },
    },
  });

  socketService.toConversation(conversationId, "conversation:join", {
    conversation: updatedGroup,
    addedUserIds: newMemberIds,
  });

  return updatedGroup;
}

/**
 * 5. Remove Member from Group
 */
async function removeMember(userId, conversationId, targetUserId, userRole = "USER") {
  const group = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!group || !group.isGroup) {
    throw new AppError(404, "Group conversation not found");
  }

  // Authorization rules:
  // - Owner can remove anyone
  // - Admin role can remove anyone
  // - Member can remove themselves (leave)
  const isOwner = group.ownerId === userId;
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const isSelf = userId === targetUserId;

  if (!isOwner && !isAdmin && !isSelf) {
    throw new AppError(403, "Unauthorized to remove member");
  }

  // Verify target is indeed a member
  const targetMember = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
  });
  if (!targetMember) {
    throw new AppError(404, "Target user is not a member of this group");
  }

  await prisma.conversationMember.delete({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
  });

  // If owner is leaving, assign next member as owner, or delete if empty
  if (group.ownerId === targetUserId) {
    const remaining = await prisma.conversationMember.findFirst({
      where: { conversationId },
      orderBy: { joinedAt: "asc" },
    });
    if (remaining) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { ownerId: remaining.userId },
      });
    } else {
      // No members left, hard delete group
      await prisma.conversation.delete({ where: { id: conversationId } });
      return { success: true, groupDeleted: true };
    }
  }

  const updatedGroup = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true, isOnline: true } },
        },
      },
    },
  });

  // Notify and leave room
  socketService.toConversation(conversationId, "conversation:leave", {
    conversationId,
    removedUserId: targetUserId,
    conversation: updatedGroup,
  });

  leaveUserSocketsFromRoom(targetUserId, `conversation:${conversationId}`);

  return updatedGroup;
}

/**
 * 6. Leave Group
 */
async function leaveGroup(userId, conversationId) {
  return removeMember(userId, conversationId, userId);
}

/**
 * 7. Delete Group (Owner only)
 */
async function deleteGroup(userId, conversationId) {
  const group = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!group || !group.isGroup) {
    throw new AppError(404, "Group conversation not found");
  }

  if (group.ownerId !== userId) {
    throw new AppError(403, "Only the group owner can delete the group");
  }

  // Capture members to leave rooms
  const members = await prisma.conversationMember.findMany({
    where: { conversationId },
    select: { userId: true },
  });

  await prisma.conversation.delete({
    where: { id: conversationId },
  });

  // Notify members
  members.forEach((m) => {
    socketService.toUser(m.userId, "conversation:delete", { conversationId });
    leaveUserSocketsFromRoom(m.userId, `conversation:${conversationId}`);
  });

  return { success: true };
}

/**
 * 8. List Conversations (Paginated)
 */
async function listConversations(userId, options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = {
    participants: { some: { userId } },
  };

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true, isOnline: true, lastSeen: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, name: true, username: true } },
          },
        },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  const unreadCounts = await Promise.all(conversations.map((conversation) => prisma.message.count({
    where: {
      conversationId: conversation.id,
      senderId: { not: userId },
      reads: { none: { userId } },
    },
  })));

  conversations.forEach((conversation, index) => {
    conversation.unreadCount = unreadCounts[index];
  });

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    items: conversations,
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * 9. Get Single Conversation Detail
 */
async function getConversation(userId, conversationId) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true, isOnline: true, lastSeen: true } },
        },
      },
    },
  });

  if (!conversation) {
    throw new AppError(404, "Conversation not found");
  }

  // Verify membership
  const member = conversation.participants.some((p) => p.userId === userId);
  if (!member) {
    throw new AppError(403, "Access denied to conversation");
  }

  return conversation;
}

module.exports = {
  createConversation,
  createGroup,
  renameGroup,
  addMembers,
  removeMember,
  leaveGroup,
  deleteGroup,
  listConversations,
  getConversation,
};
