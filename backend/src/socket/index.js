const { Server } = require("socket.io");
const authMiddleware = require("./auth");
const socketService = require("../services/socketService");
const registerEvents = require("./events");
const prisma = require("../lib/prisma");
const { CORS_ORIGINS, CORS_ALLOW_CREDENTIALS } = require("../config/env");

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: CORS_ORIGINS.length === 1 ? CORS_ORIGINS[0] : CORS_ORIGINS,
      methods: ["GET", "POST"],
      credentials: CORS_ALLOW_CREDENTIALS,
    },
  });

  socketService.init(io);

  io.use(authMiddleware);

  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    // Join personal room
    socket.join(`user:${userId}`);

    // Map to online status
    socketService.addOnlineUser(userId, socket.id);

    // Update DB status
    const lastSeen = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeen },
    }).catch(() => null);

    // Join conversation rooms
    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    memberships.forEach((m) => {
      socket.join(`conversation:${m.conversationId}`);
    });
    const communityMemberships = await prisma.communityMember.findMany({
      where: { userId },
      select: { community: { select: { channels: { select: { conversationId: true } } } } },
    });
    communityMemberships.flatMap((membership) => membership.community.channels).forEach((channel) => {
      socket.join(`conversation:${channel.conversationId}`);
    });

    // Broadcast online status to participants
    const conversationIds = memberships.map((m) => m.conversationId);
    if (conversationIds.length > 0) {
      const otherMembers = await prisma.conversationMember.findMany({
        where: {
          conversationId: { in: conversationIds },
          userId: { not: userId },
        },
        select: { userId: true },
      });
      const uniqueUserIds = [...new Set(otherMembers.map((m) => m.userId))];
      uniqueUserIds.forEach((uid) => {
        socketService.toUser(uid, "user:online", { userId, lastSeen });
      });
    }

    // Register all messaging events
    registerEvents(io, socket);

    // Notify client when the socket is fully initialized and room membership is established
    socket.emit("socket:ready");

    socket.on("disconnect", async () => {
      socketService.removeOnlineUser(userId, socket.id);

      // Check if user is fully offline (no other socket tabs/sessions)
      const onlineUsers = socketService.getOnlineUsers();
      if (!onlineUsers.has(userId)) {
        const offlineTime = new Date();
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false, lastSeen: offlineTime },
        }).catch(() => null);

        // Broadcast offline status
        if (conversationIds.length > 0) {
          const otherMembers = await prisma.conversationMember.findMany({
            where: {
              conversationId: { in: conversationIds },
              userId: { not: userId },
            },
            select: { userId: true },
          });
          const uniqueUserIds = [...new Set(otherMembers.map((m) => m.userId))];
          uniqueUserIds.forEach((uid) => {
            socketService.toUser(uid, "user:offline", { userId, lastSeen: offlineTime });
          });
        }
      }
    });
  });

  return io;
}

module.exports = { initSocket };
