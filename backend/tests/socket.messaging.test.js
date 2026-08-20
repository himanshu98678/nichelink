const { io } = require("socket.io-client");
const request = require("supertest");
const http = require("http");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");
const { initSocket } = require("../src/socket");

jest.setTimeout(60000);

function withTimeout(promise, ms, message) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

let server;
let address;
let userAToken, userBToken;
let userAId, userBId;
let conversationId;
let openSockets = [];

function connectSocket(url, opts) {
  const socket = io(url, { autoConnect: false, reconnection: false, timeout: 10000, ...opts });
  openSockets.push(socket);
  return withTimeout(
    new Promise((resolve, reject) => {
      let hasConnected = false;
      let hasReady = false;

      const tryResolve = () => {
        if (hasConnected && hasReady) {
          cleanupListeners();
          resolve(socket);
        }
      };

      const onConnect = () => {
        hasConnected = true;
        tryResolve();
      };

      const onReady = () => {
        hasReady = true;
        tryResolve();
      };

      const onError = (err) => {
        cleanupListeners();
        reject(err instanceof Error ? err : new Error(String(err)));
      };

      const cleanupListeners = () => {
        socket.off("connect", onConnect);
        socket.off("socket:ready", onReady);
        socket.off("connect_error", onError);
        socket.off("connect_timeout", onError);
      };

      socket.on("connect", onConnect);
      socket.on("socket:ready", onReady);
      socket.on("connect_error", (err) => onError(err));
      socket.on("connect_timeout", (err) => onError(err));
      socket.on("error", (err) => onError(err));
      socket.on("disconnect", () => {});
      socket.connect();
    }),
    10000,
    "Socket connection timed out"
  );
}

function disconnectAllSockets() {
  openSockets.forEach((socket) => {
    try {
      socket.off();
      if (socket.connected) {
        socket.disconnect();
      }
      if (typeof socket.close === "function") {
        socket.close();
      }
    } catch {
      // ignore cleanup errors
    }
  });
  openSockets = [];
}

beforeAll(async () => {
  const ts = Date.now();
  server = http.createServer(app);
  initSocket(server);
  await new Promise((resolve) => {
    const listener = server.listen(0, () => {
      address = listener.address();
      resolve();
    });
  });

  const resA = await request(app).post("/api/auth/register").send({
    name: "Socket A",
    username: `socket_a_${ts}`,
    email: `socket_a_${ts}@example.com`,
    password: "Password123!",
  });
  userAToken = resA.body.token;
  userAId = resA.body.user.id;

  const resB = await request(app).post("/api/auth/register").send({
    name: "Socket B",
    username: `socket_b_${ts}`,
    email: `socket_b_${ts}@example.com`,
    password: "Password123!",
  });
  userBToken = resB.body.token;
  userBId = resB.body.user.id;

  const conv = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [{ userId: userAId }, { userId: userBId }],
      },
    },
  });
  conversationId = conv.id;
});

afterAll(async () => {
  const convIds = [conversationId].filter(Boolean);
  await prisma.messageRead.deleteMany({ where: { userId: { in: [userAId, userBId].filter(Boolean) } } });
  await prisma.messageReaction.deleteMany({ where: { userId: { in: [userAId, userBId].filter(Boolean) } } });
  await prisma.messageAttachment.deleteMany({ where: { message: { conversationId: { in: convIds } } } });
  await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
  await prisma.conversationMember.deleteMany({ where: { conversationId: { in: convIds } } });
  await prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId].filter(Boolean) } } });
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

describe("Socket Messaging Integration", () => {
  afterEach(() => {
    disconnectAllSockets();
  });

  test("real-time message send and receive", async () => {
    const url = `http://localhost:${address.port}`;
    const optsA = { auth: { token: userAToken }, transports: ["websocket"] };
    const optsB = { auth: { token: userBToken }, transports: ["websocket"] };

    const socketA = await connectSocket(url, optsA);
    const socketB = await connectSocket(url, optsB);

    const messagePayload = {
      conversationId,
      content: "Hello socket world",
    };

    const received = new Promise((resolve, reject) => {
      const onMessageNew = (data) => {
        try {
          expect(data.conversationId).toBe(conversationId);
          expect(data.content).toBe(messagePayload.content);
          expect(data.sender.id).toBe(userAId);
          socketB.off("message:new", onMessageNew);
          resolve();
        } catch (err) {
          socketB.off("message:new", onMessageNew);
          reject(err);
        }
      };
      socketB.on("message:new", onMessageNew);
    });

    await withTimeout(
      new Promise((resolve, reject) => {
        socketA.emit("message:send", messagePayload, (response) => {
          if (!response.success) {
            reject(new Error(response.error || "Socket send failed"));
          } else {
            expect(response.message.content).toBe(messagePayload.content);
            resolve();
          }
        });
      }),
      10000,
      "Socket send callback timed out"
    );

    await withTimeout(received, 10000, "Socket message:new event timed out");
    socketA.disconnect();
    socketB.disconnect();
  });

  test("typing indicator is emitted to conversation room", async () => {
    const url = `http://localhost:${address.port}`;
    const optsA = { auth: { token: userAToken }, transports: ["websocket"] };
    const optsB = { auth: { token: userBToken }, transports: ["websocket"] };

    const socketA = await connectSocket(url, optsA);
    const socketB = await connectSocket(url, optsB);

    const typingReceived = new Promise((resolve, reject) => {
      socketB.on("message:typing", (data) => {
        try {
          expect(data.conversationId).toBe(conversationId);
          expect(data.userId).toBe(userAId);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    socketA.emit("message:typing", { conversationId });

    await withTimeout(typingReceived, 10000, "Socket message:typing event timed out");
  });
});
