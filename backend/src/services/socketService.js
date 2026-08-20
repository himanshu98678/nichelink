let io = null;
const onlineUsers = new Map(); // userId -> Set of socketIds

function init(ioInstance) {
  io = ioInstance;
}

function getIo() {
  return io;
}

function getOnlineUsers() {
  return onlineUsers;
}

function addOnlineUser(userId, socketId) {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);
}

function removeOnlineUser(userId, socketId) {
  if (onlineUsers.has(userId)) {
    const sockets = onlineUsers.get(userId);
    sockets.delete(socketId);
    if (sockets.size === 0) {
      onlineUsers.delete(userId);
    }
  }
}

function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

function toUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

function toConversation(conversationId, event, data) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
}

function joinUserSocketsToRoom(userId, roomName) {
  const socketIds = onlineUsers.get(userId);
  socketIds?.forEach((socketId) => io?.sockets.sockets.get(socketId)?.join(roomName));
}

function leaveUserSocketsFromRoom(userId, roomName) {
  const socketIds = onlineUsers.get(userId);
  socketIds?.forEach((socketId) => io?.sockets.sockets.get(socketId)?.leave(roomName));
}

module.exports = {
  init,
  getIo,
  getOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  isUserOnline,
  toUser,
  toConversation,
  joinUserSocketsToRoom,
  leaveUserSocketsFromRoom,
};
