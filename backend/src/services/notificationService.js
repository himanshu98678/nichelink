const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const socketService = require("./socketService");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * 1. Create Notification
 */
async function createNotification(data) {
  if (data.senderId && data.recipientId === data.senderId) {
    // Do not persist or emit notifications when the sender and recipient are the same user.
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      recipientId: data.recipientId,
      senderId: data.senderId || null,
      type: data.type,
      title: data.title,
      message: data.message,
      referenceId: data.referenceId || null,
      referenceType: data.referenceType || null,
      isRead: false,
    },
    include: {
      sender: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });
  // Emit Socket.IO events to recipient
  socketService.toUser(data.recipientId, "notification:new", notification);

  const unreadCount = await countUnread(data.recipientId);
  socketService.toUser(data.recipientId, "notification:count", { unreadCount });

  return notification;
}

/**
 * 2. Create Bulk Notifications
 */
async function createBulkNotifications(notificationsData = []) {
  const created = [];
  for (const data of notificationsData) {
    try {
      const n = await createNotification(data);
      if (n) {
        created.push(n);
      }
    } catch (error) {
      // Log error but continue other notifications
      const { logger } = require("../utils/logger");
      logger.error({ recipientId: data.recipientId, error }, "Bulk notification failed");
    }
  }
  return created;
}

/**
 * 3. Get User Notifications (Paginated & Filtered)
 */
async function getUserNotifications(userId, options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = { recipientId: userId };

  if (options.type) {
    where.type = options.type;
  }

  if (options.isRead !== undefined) {
    where.isRead = options.isRead === "true" || options.isRead === true;
  }

  if (options.from || options.to) {
    where.createdAt = {
      ...(options.from ? { gte: new Date(options.from) } : {}),
      ...(options.to ? { lte: new Date(options.to) } : {}),
    };
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        sender: { select: { id: true, name: true, username: true, avatar: true } },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    items: notifications,
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * 4. Mark specific notification as read
 */
async function markAsRead(userId, notificationId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  if (notification.recipientId !== userId) {
    throw new AppError(403, "Access denied to notification");
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
    include: {
      sender: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });

  socketService.toUser(userId, "notification:read", { notificationIds: [notificationId] });

  const unreadCount = await countUnread(userId);
  socketService.toUser(userId, "notification:count", { unreadCount });

  return updated;
}

/**
 * 5. Mark all user's notifications as read
 */
async function markAllRead(userId) {
  const unreadList = await prisma.notification.findMany({
    where: { recipientId: userId, isRead: false },
    select: { id: true },
  });
  const unreadIds = unreadList.map((n) => n.id);

  if (unreadIds.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: unreadIds } },
      data: { isRead: true },
    });
  }

  socketService.toUser(userId, "notification:read", { notificationIds: unreadIds, all: true });
  socketService.toUser(userId, "notification:count", { unreadCount: 0 });

  return { success: true, markedCount: unreadIds.length };
}

/**
 * 6. Delete specific notification
 */
async function deleteNotification(userId, notificationId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  if (notification.recipientId !== userId) {
    throw new AppError(403, "Access denied to notification");
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  socketService.toUser(userId, "notification:deleted", { notificationIds: [notificationId] });

  const unreadCount = await countUnread(userId);
  socketService.toUser(userId, "notification:count", { unreadCount });

  return { success: true };
}

/**
 * 7. Delete all notifications of user
 */
async function deleteAllNotifications(userId) {
  await prisma.notification.deleteMany({
    where: { recipientId: userId },
  });

  socketService.toUser(userId, "notification:deleted", { all: true });
  socketService.toUser(userId, "notification:count", { unreadCount: 0 });

  return { success: true };
}

/**
 * 8. Count unread notifications
 */
async function countUnread(userId) {
  return prisma.notification.count({
    where: { recipientId: userId, isRead: false },
  });
}

/**
 * Parses user mentions (@username) in texts and generates MENTION notifications
 */
async function handleMentions(senderId, text, referenceId, referenceType) {
  if (!text || typeof text !== "string") {return [];}
  const matches = text.match(/@(\w+)/g);
  if (!matches) {return [];}

  const usernames = [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
  if (usernames.length === 0) {return [];}

  const users = await prisma.user.findMany({
    where: { username: { in: usernames } },
    select: { id: true, username: true },
  });

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { username: true },
  });

  const notifications = [];
  for (const targetUser of users) {
    if (targetUser.id !== senderId) {
      const n = await createNotification({
        recipientId: targetUser.id,
        senderId,
        type: "MENTION",
        title: "New Mention",
        message: `${sender?.username || "Someone"} mentioned you in a ${referenceType.toLowerCase()}`,
        referenceId,
        referenceType,
      }).catch(() => null);
      if (n) {notifications.push(n);}
    }
  }
  return notifications;
}

module.exports = {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  deleteAllNotifications,
  countUnread,
  handleMentions,
};
