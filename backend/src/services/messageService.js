const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const socketService = require("./socketService");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const messageInclude = {
  sender: { select: { id: true, name: true, username: true, avatar: true } },
  attachments: true,
  replyTo: {
    include: {
      sender: { select: { id: true, name: true, username: true } },
    },
  },
  reactions: {
    include: {
      user: { select: { id: true, name: true, username: true } },
    },
  },
  reads: {
    include: {
      user: { select: { id: true, name: true, username: true } },
    },
  },
};

const hasConversationAccess = async (userId, conversationId) => {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (member) { return true; }
  const channel = await prisma.communityChannel.findUnique({ where: { conversationId }, select: { communityId: true } });
  if (!channel) { return false; }
  const communityMember = await prisma.communityMember.findUnique({ where: { communityId_userId: { communityId: channel.communityId, userId } } });
  return Boolean(communityMember);
};

const getConversationRecipients = async (conversationId, userId) => {
  const channel = await prisma.communityChannel.findUnique({ where: { conversationId }, select: { communityId: true } });
  if (channel) {
    return prisma.communityMember.findMany({ where: { communityId: channel.communityId, userId: { not: userId } }, select: { userId: true } });
  }
  return prisma.conversationMember.findMany({ where: { conversationId, userId: { not: userId } }, select: { userId: true } });
};

/**
 * 1. Send Message
 */
async function sendMessage(userId, { conversationId, content, replyToId, attachments = [] }) {
  // Verify member access
  if (!(await hasConversationAccess(userId, conversationId))) {
    throw new AppError(403, "Access denied to conversation");
  }

  // Allow sending files without text content
  const hasContent = content && content.trim().length > 0;
  const hasAttachments = attachments && attachments.length > 0;
  if (!hasContent && !hasAttachments) {
    throw new AppError(400, "Message content or attachment is required");
  }

  const ALLOWED_ATTACHMENT_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-7z-compressed",
    "video/mp4",
  ];

  if (hasAttachments) {
    attachments.forEach((attachment) => {
      if (!attachment || typeof attachment !== "object") {
        throw new AppError(400, "Invalid attachment format");
      }
      const { url, fileName, fileType, fileSize } = attachment;
      if (!url || !fileName || !fileType) {
        throw new AppError(400, "Attachment url, fileName, and fileType are required");
      }
      if (typeof fileName !== "string" || fileName.trim().length === 0 || fileName.length > 255) {
        throw new AppError(400, "Attachment fileName must be a non-empty string up to 255 characters");
      }
      if (!ALLOWED_ATTACHMENT_TYPES.includes(fileType)) {
        throw new AppError(400, "Unsupported attachment file type");
      }
      if (fileSize !== undefined && (typeof fileSize !== "number" || fileSize < 1 || fileSize > 52428800)) {
        throw new AppError(400, "Attachment fileSize must be a number between 1 and 52428800 bytes");
      }
      try {
        new URL(url);
      } catch {
        throw new AppError(400, "Attachment url must be a valid URL");
      }
    });
  }

  if (replyToId) {
    const repliedMessage = await prisma.message.findUnique({
      where: { id: replyToId },
      select: { conversationId: true },
    });
    if (!repliedMessage || repliedMessage.conversationId !== conversationId) {
      throw new AppError(400, "Reply message must belong to the same conversation");
    }
  }

  const message = await prisma.$transaction(async (tx) => {
    // Create the message
    const msg = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content ? content.trim() : "",
        replyToId: replyToId || null,
        attachments: {
          create: attachments.map((a) => ({
            url: a.url,
            fileName: a.fileName,
            fileType: a.fileType,
            fileSize: a.fileSize || null,
          })),
        },
      },
      include: messageInclude,
    });

    // Update conversation's updatedAt timestamp
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return msg;
  }, { timeout: 30000 });

  // Broadcast real-time message event to room
  socketService.toConversation(conversationId, "message:new", message);

  // Send MESSAGE notifications to all other conversation members
  const otherMembers = await getConversationRecipients(conversationId, userId);

  if (otherMembers.length > 0) {
    const notificationService = require("./notificationService");
    const sender = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await notificationService.createBulkNotifications(
      otherMembers.map((m) => ({
        recipientId: m.userId,
        senderId: userId,
        type: "MESSAGE",
        title: "New Message",
        message: `${sender?.username || "Someone"} sent you a message`,
        referenceId: message.id,
        referenceType: "MESSAGE",
      }))
    ).catch(() => null);
  }

  return message;
}

/**
 * 2. Edit Message (Sender only)
 */
async function editMessage(userId, messageId, content) {
  if (!content || !content.trim()) {
    throw new AppError(400, "Message content is required");
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new AppError(404, "Message not found");
  }

  if (message.senderId !== userId) {
    throw new AppError(403, "Unauthorized to edit this message");
  }

  if (message.isDeleted) {
    throw new AppError(400, "Cannot edit a deleted message");
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: content.trim(),
      isEdited: true,
    },
    include: messageInclude,
  });

  socketService.toConversation(message.conversationId, "message:edit", updated);

  return updated;
}

/**
 * 3. Delete Message (Sender only)
 */
async function deleteMessage(userId, messageId, { hard = false } = {}) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new AppError(404, "Message not found");
  }

  if (message.senderId !== userId) {
    throw new AppError(403, "Unauthorized to delete this message");
  }

  let updated;
  if (hard) {
    await prisma.message.delete({ where: { id: messageId } });
    updated = { id: messageId, conversationId: message.conversationId, isHardDeleted: true };
  } else {
    // Soft delete
    updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: "This message was deleted",
        isDeleted: true,
        attachments: { deleteMany: {} },
      },
      include: messageInclude,
    });
  }

  socketService.toConversation(message.conversationId, "message:delete", updated);

  return updated;
}

/**
 * 4. Mark Messages in Conversation as Seen / Read
 */
async function markSeen(userId, conversationId) {
  // Verify member access
  if (!(await hasConversationAccess(userId, conversationId))) {
    throw new AppError(403, "Access denied to conversation");
  }

  // Find all messages not sent by userId that have not been read by userId
  const unread = await prisma.message.findMany({
    where: {
      conversationId,
      senderId: { not: userId },
      reads: { none: { userId } },
    },
    select: { id: true },
  });

  if (unread.length > 0) {
    const seenAt = new Date();
    await prisma.messageRead.createMany({
      data: unread.map((msg) => ({
        messageId: msg.id,
        userId,
        seenAt,
      })),
      skipDuplicates: true,
    });

    socketService.toConversation(conversationId, "message:seen", {
      conversationId,
      userId,
      seenAt,
      messageIds: unread.map((m) => m.id),
    });
  }

  return { success: true, markedCount: unread.length };
}

/**
 * 5. React to Message (Toggles emoji reactions)
 */
async function reactToMessage(userId, messageId, reaction) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) {
    throw new AppError(404, "Message not found");
  }

  // Verify member access
  if (!(await hasConversationAccess(userId, message.conversationId))) {
    throw new AppError(403, "Access denied to conversation");
  }

  const existing = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_reaction: { messageId, userId, reaction },
    },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.create({
      data: { messageId, userId, reaction },
    });
  }

  const updatedReactions = await prisma.messageReaction.findMany({
    where: { messageId },
    include: {
      user: { select: { id: true, name: true, username: true } },
    },
  });

  socketService.toConversation(message.conversationId, "message:reaction", {
    messageId,
    reactions: updatedReactions,
  });

  return updatedReactions;
}

/**
 * 6. Search Messages
 */
async function searchMessages(userId, options = {}) {
  const q = options.q ? options.q.trim() : "";
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = {
    conversation: {
      participants: { some: { userId } },
    },
    isDeleted: false,
    content: { contains: q, mode: "insensitive" },
  };

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: messageInclude,
    }),
    prisma.message.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    items: messages,
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * 7. List Messages in Conversation (Chronological order returned: newest last)
 */
async function listMessages(userId, conversationId, options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  // Verify member access
  if (!(await hasConversationAccess(userId, conversationId))) {
    throw new AppError(403, "Access denied to conversation");
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: messageInclude,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  // Reverse list so that newest messages are last (chronological inside the page)
  const items = messages.reverse();
  const totalPages = Math.ceil(total / limit) || 0;

  return {
    items,
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

module.exports = {
  sendMessage,
  editMessage,
  deleteMessage,
  markSeen,
  reactToMessage,
  searchMessages,
  listMessages,
};
