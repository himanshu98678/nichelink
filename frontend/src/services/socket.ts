import { io, Socket } from 'socket.io-client';
import { ROOT_SERVER_URL } from './api';

let socket: Socket | null = null;
let connectedUserId: string | null = null;

export const connectSocket = (userId: string): Socket | null => {
  const token = localStorage.getItem('nichelink_token');
  if (!token || !userId) return null;

  if (socket && connectedUserId === userId) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  disconnectSocket();
  connectedUserId = userId;
  socket = io(ROOT_SERVER_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect_error', (error) => {
    console.warn('Real-time connection unavailable:', error.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  connectedUserId = null;
};
