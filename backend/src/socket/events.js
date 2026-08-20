const messageService = require("../services/messageService");
const prisma = require("../lib/prisma");
const communityChatService = require("../services/communityChatService");
const { getRedisClient, getRedisConnection } = require("../middlewares/rateLimiter");
const { randomUUID } = require("crypto");

const MESSAGE_RATE_LIMIT_WINDOW_MS = 30 * 1000;
const MESSAGE_RATE_LIMIT_MAX = 15;
const socketMessageRateMap = new Map();
const activeCalls = new Map();

async function canSendMessage(socketId) {
  const redis = getRedisClient();
  if (redis) {
    await getRedisConnection();
    const key = `niche-link:socket-rate:${socketId}`;
    const count = await redis.incr(key);
    if (count === 1) { await redis.expire(key, 30); }
    return count <= MESSAGE_RATE_LIMIT_MAX;
  }
  const now = Date.now();
  const record = socketMessageRateMap.get(socketId) || [];
  const windowed = record.filter((timestamp) => now - timestamp < MESSAGE_RATE_LIMIT_WINDOW_MS);
  if (windowed.length >= MESSAGE_RATE_LIMIT_MAX) {
    socketMessageRateMap.set(socketId, windowed);
    return false;
  }
  windowed.push(now);
  socketMessageRateMap.set(socketId, windowed);
  return true;
}

function cleanupRateLimit(socketId) {
  socketMessageRateMap.delete(socketId);
}

function emitSocketError(socket, event, error) {
  socket.emit("socket:error", {
    event,
    message: error?.message || "Socket event failed",
  });
}

const validateSignalPayload = (payload, event) => {
  if (!payload || typeof payload !== "object") { throw new Error(`${event} payload is required`); }
  if (!payload.callId || !payload.conversationId) { throw new Error("Call ID and conversation ID are required"); }
};

const getDirectCallContext = async (userId, conversationId) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      isGroup: false,
      participants: { some: { userId } },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
      },
    },
  });
  if (!conversation || conversation.participants.length !== 2) {
    throw new Error("Access denied to direct call");
  }
  const peer = conversation.participants.find((participant) => participant.userId !== userId);
  if (!peer) { throw new Error("Call participant not found"); }
  return { conversation, peer: peer.user };
};

const getCall = (socket, payload) => {
  validateSignalPayload(payload, "Call");
  const call = activeCalls.get(payload.callId);
  if (!call || call.conversationId !== payload.conversationId || !call.participants.has(socket.user.id)) {
    throw new Error("Call not found or access denied");
  }
  return call;
};

module.exports = (io, socket) => {
  const userId = socket.user.id;

  const verifyRoomMembership = (conversationId) => {
    const roomName = `conversation:${conversationId}`;
    if (!socket.rooms.has(roomName)) {
      throw new Error("Access denied to conversation");
    }
  };

  // Real-time typing indicators
  socket.on("message:typing", (data) => {
    try {
      const { conversationId } = data || {};
      if (!conversationId) {return;}
      verifyRoomMembership(conversationId);
      socket.to(`conversation:${conversationId}`).emit("message:typing", {
        conversationId,
        userId,
        username: socket.user.username,
      });
    } catch (error) {
      emitSocketError(socket, "message:typing", error);
    }
  });

  socket.on("message:stopTyping", (data) => {
    try {
      const { conversationId } = data || {};
      if (!conversationId) {return;}
      verifyRoomMembership(conversationId);
      socket.to(`conversation:${conversationId}`).emit("message:stopTyping", {
        conversationId,
        userId,
      });
    } catch (error) {
      emitSocketError(socket, "message:stopTyping", error);
    }
  });

  // Real-time message Seen status
  socket.on("message:seen", async (data, callback) => {
    try {
      const { conversationId } = data;
      if (!conversationId) {throw new Error("Conversation ID is required");}
      verifyRoomMembership(conversationId);
      const result = await messageService.markSeen(userId, conversationId);
      if (callback) {callback({ success: true, result });}
    } catch (error) {
      if (callback) {callback({ success: false, error: error.message });}
    }
  });

  // Real-time reactions
  socket.on("message:reaction", async (data, callback) => {
    try {
      const { messageId, reaction } = data;
      if (!messageId || !reaction) {throw new Error("Message ID and reaction emoji are required");}
      const result = await messageService.reactToMessage(userId, messageId, reaction);
      if (callback) {callback({ success: true, result });}
    } catch (error) {
      if (callback) {callback({ success: false, error: error.message });}
    }
  });

  // Real-time message send via Socket
  socket.on("message:send", async (data, callback) => {
    try {
      const { conversationId, content, replyToId, attachments } = data || {};
      if (!conversationId) {throw new Error("Conversation ID is required");}
      verifyRoomMembership(conversationId);
      if (!(await canSendMessage(socket.id))) {
        throw new Error("Too many messages, please try again later");
      }
      const message = await messageService.sendMessage(userId, {
        conversationId,
        content,
        replyToId,
        attachments,
      });
      if (callback) {callback({ success: true, message });}
    } catch (error) {
      if (callback) {callback({ success: false, error: error.message });}
    }
  });

  socket.on("call:initiate", async (data, callback) => {
    try {
      const { conversationId, callType } = data || {};
      if (!conversationId) { throw new Error("Conversation ID is required"); }
      if (!["voice", "video"].includes(callType)) { throw new Error("Call type must be voice or video"); }
      verifyRoomMembership(conversationId);
      const { peer } = await getDirectCallContext(userId, conversationId);
      const callId = randomUUID();
      activeCalls.set(callId, {
        callId,
        conversationId,
        callerId: userId,
        participants: new Set([userId, peer.id]),
        status: "calling",
      });
      socket.to(`conversation:${conversationId}`).emit("call:incoming", {
        callId,
        conversationId,
        callType,
        caller: socket.user,
      });
      socket.to(`conversation:${conversationId}`).emit("call:state", { callId, conversationId, state: "calling" });
      if (callback) { callback({ success: true, callId, peer }); }
    } catch (error) {
      if (callback) { callback({ success: false, error: error.message }); }
      else { emitSocketError(socket, "call:initiate", error); }
    }
  });

  socket.on("call:accept", (data, callback) => {
    try {
      const call = getCall(socket, data);
      if (call.status !== "calling") { throw new Error("Call is no longer waiting for acceptance"); }
      call.status = "accepted";
      socket.to(`conversation:${call.conversationId}`).emit("call:accepted", { callId: call.callId, conversationId: call.conversationId });
      socket.to(`conversation:${call.conversationId}`).emit("call:state", { callId: call.callId, conversationId: call.conversationId, state: "accepted" });
      if (callback) { callback({ success: true }); }
    } catch (error) {
      if (callback) { callback({ success: false, error: error.message }); }
    }
  });

  const finishCall = (event, state) => (data, callback) => {
    try {
      const call = getCall(socket, data);
      call.status = state;
      socket.to(`conversation:${call.conversationId}`).emit(event, { callId: call.callId, conversationId: call.conversationId, userId });
      socket.to(`conversation:${call.conversationId}`).emit("call:state", { callId: call.callId, conversationId: call.conversationId, state });
      if (["rejected", "cancelled", "ended"].includes(state)) { activeCalls.delete(call.callId); }
      if (callback) { callback({ success: true }); }
    } catch (error) {
      if (callback) { callback({ success: false, error: error.message }); }
    }
  };

  socket.on("call:reject", finishCall("call:rejected", "rejected"));
  socket.on("call:cancel", finishCall("call:cancelled", "cancelled"));
  socket.on("call:end", finishCall("call:ended", "ended"));

  const forwardSignal = (event, payloadKey) => (data, callback) => {
    try {
      const call = getCall(socket, data);
      if (!data[payloadKey] || typeof data[payloadKey] !== "object") { throw new Error(`${payloadKey} payload is required`); }
      socket.to(`conversation:${call.conversationId}`).emit(event, {
        callId: call.callId,
        conversationId: call.conversationId,
        [payloadKey]: data[payloadKey],
      });
      if (callback) { callback({ success: true }); }
    } catch (error) {
      if (callback) { callback({ success: false, error: error.message }); }
    }
  };

  socket.on("call:offer", forwardSignal("call:offer", "offer"));
  socket.on("call:answer", forwardSignal("call:answer", "answer"));
  socket.on("call:ice-candidate", forwardSignal("call:ice-candidate", "candidate"));

  const verifyCommunityChannel = async (channelId) => {
    if (!channelId) { throw new Error("Channel ID is required"); }
    const { channel } = await communityChatService.ensureChannelMember(userId, channelId);
    const roomName = `conversation:${channel.conversationId}`;
    if (!socket.rooms.has(roomName)) { socket.join(roomName); }
    return channel;
  };

  socket.on("community:typing", async (data) => {
    try {
      const channel = await verifyCommunityChannel(data?.channelId);
      socket.to(`conversation:${channel.conversationId}`).emit("community:typing", { channelId: data.channelId, userId, username: socket.user.username });
    } catch (error) { emitSocketError(socket, "community:typing", error); }
  });

  socket.on("community:stopTyping", async (data) => {
    try {
      const channel = await verifyCommunityChannel(data?.channelId);
      socket.to(`conversation:${channel.conversationId}`).emit("community:stopTyping", { channelId: data.channelId, userId });
    } catch (error) { emitSocketError(socket, "community:stopTyping", error); }
  });

  socket.on("community:message:send", async (data, callback) => {
    try {
      await verifyCommunityChannel(data?.channelId);
      const message = await communityChatService.sendMessage(userId, data.channelId, { content: data.content });
      if (callback) { callback({ success: true, message }); }
    } catch (error) {
      if (callback) { callback({ success: false, error: error.message }); }
    }
  });

  socket.on("disconnect", () => {
    cleanupRateLimit(socket.id);
    [...activeCalls.values()]
      .filter((call) => call.participants.has(userId))
      .forEach((call) => {
        socket.to(`conversation:${call.conversationId}`).emit("call:ended", {
          callId: call.callId,
          conversationId: call.conversationId,
          userId,
          reason: "socket-disconnected",
        });
        activeCalls.delete(call.callId);
      });
  });
};
