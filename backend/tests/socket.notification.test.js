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
    if (timeoutId) {clearTimeout(timeoutId);}
  });
}

let server;
let address;
let userAToken;
let userBToken;
let userAId;
let userBId;
let postId;
let openSockets = [];

function connectSocket(url, opts) {
  const socket = io(url, { autoConnect: false, reconnection: false, timeout: 10000, ...opts });
  openSockets.push(socket);
  return withTimeout(
    new Promise((resolve, reject) => {
      let connected = false;
      let ready = false;

      const cleanup = () => {
        socket.off("connect", onConnect);
        socket.off("socket:ready", onReady);
        socket.off("connect_error", onError);
        socket.off("connect_timeout", onError);
        socket.off("error", onError);
      };

      const onConnect = () => {
        connected = true;
        if (ready) {
          cleanup();
          resolve(socket);
        }
      };

      const onReady = () => {
        ready = true;
        if (connected) {
          cleanup();
          resolve(socket);
        }
      };

      const onError = (err) => {
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      };

      socket.on("connect", onConnect);
      socket.on("socket:ready", onReady);
      socket.on("connect_error", onError);
      socket.on("connect_timeout", onError);
      socket.on("error", onError);
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
      if (socket.connected) {socket.disconnect();}
      if (typeof socket.close === "function") {socket.close();}
    } catch {
      // ignore cleanup issues
    }
  });
  openSockets = [];
}

afterEach(() => {
  disconnectAllSockets();
});

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

  const usernameSuffix = ts.toString().slice(-6);

  const resA = await request(app).post("/api/auth/register").send({
    name: "Socket Notif A",
    username: `socket_notif_a_${usernameSuffix}`,
    email: `socket_notif_a_${usernameSuffix}@example.com`,
    password: "Password123!",
  });
  expect(resA.statusCode).toBe(201);
  userAToken = resA.body.token;
  userAId = resA.body.user.id;

  const resB = await request(app).post("/api/auth/register").send({
    name: "Socket Notif B",
    username: `socket_notif_b_${usernameSuffix}`,
    email: `socket_notif_b_${usernameSuffix}@example.com`,
    password: "Password123!",
  });
  expect(resB.statusCode).toBe(201);
  userBToken = resB.body.token;
  userBId = resB.body.user.id;

  const post = await prisma.post.create({
    data: {
      authorId: userBId,
      content: "Notification socket test post",
    },
  });
  postId = post.id;
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { recipientId: { in: [userAId, userBId].filter(Boolean) } } });
  await prisma.post.deleteMany({ where: { id: postId } });
  await prisma.conversationMember.deleteMany({ where: { userId: { in: [userAId, userBId].filter(Boolean) } } });
  await prisma.conversation.deleteMany({ where: { participants: { none: {} } } });
  await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId].filter(Boolean) } } });
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

describe("Socket Notification Events", () => {
  test("authenticated socket receives notification:new and notification:count", async () => {
    const url = `http://localhost:${address.port}`;
    const socketB = await connectSocket(url, { auth: { token: userBToken }, transports: ["websocket"] });

    const notificationPromise = new Promise((resolve, reject) => {
      socketB.on("notification:new", (notification) => {
        try {
          expect(notification.type).toBe("LIKE");
          expect(notification.recipientId).toBe(userBId);
          expect(notification.referenceId).toBe(postId);
          resolve(notification);
        } catch (error) {
          reject(error);
        }
      });
    });

    const countPromise = new Promise((resolve, reject) => {
      socketB.on("notification:count", (payload) => {
        try {
          expect(typeof payload.unreadCount).toBe("number");
          expect(payload.unreadCount).toBeGreaterThanOrEqual(1);
          resolve(payload);
        } catch (error) {
          reject(error);
        }
      });
    });

    const res = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);

    await withTimeout(Promise.all([notificationPromise, countPromise]), 10000, "Notification socket events timed out");
  });

  test("notification:read and notification:deleted are emitted to recipient", async () => {
    const url = `http://localhost:${address.port}`;
    const socketB = await connectSocket(url, { auth: { token: userBToken }, transports: ["websocket"] });

    const notification = await prisma.notification.findFirst({ where: { recipientId: userBId, type: "LIKE" } });
    expect(notification).toBeTruthy();

    const readPromise = new Promise((resolve, reject) => {
      socketB.on("notification:read", (payload) => {
        try {
          expect(Array.isArray(payload.notificationIds)).toBe(true);
          expect(payload.notificationIds).toContain(notification.id);
          resolve(payload);
        } catch (error) {
          reject(error);
        }
      });
    });

    const countPromise = new Promise((resolve, reject) => {
      socketB.on("notification:count", (payload) => {
        try {
          expect(payload.unreadCount).toBeGreaterThanOrEqual(0);
          resolve(payload);
        } catch (error) {
          reject(error);
        }
      });
    });

    const resRead = await request(app)
      .patch(`/api/notifications/${notification.id}/read`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resRead.statusCode).toBe(200);
    await withTimeout(Promise.all([readPromise, countPromise]), 10000, "Notification read socket events timed out");

    const newNotification = await prisma.notification.create({
      data: {
        recipientId: userBId,
        senderId: userAId,
        type: "MESSAGE",
        title: "Test Deleted Notification",
        message: "This notification will be deleted",
        referenceId: "test-ref",
        referenceType: "MESSAGE",
      },
    });

    const deletedPromise = new Promise((resolve, reject) => {
      socketB.on("notification:deleted", (payload) => {
        try {
          expect(payload.notificationIds).toContain(newNotification.id);
          resolve(payload);
        } catch (error) {
          reject(error);
        }
      });
    });

    const resDelete = await request(app)
      .delete(`/api/notifications/${newNotification.id}`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resDelete.statusCode).toBe(200);
    await withTimeout(deletedPromise, 10000, "Notification deleted socket event timed out");
  });

  test("socket connection fails without auth token", async () => {
    const url = `http://localhost:${address.port}`;
    const socket = io(url, { autoConnect: false, reconnection: false, timeout: 3000, transports: ["websocket"] });

    const connectionPromise = new Promise((resolve, reject) => {
      socket.on("connect", () => reject(new Error("Should not connect without token")));
      socket.on("connect_error", (err) => resolve(err));
      socket.on("connect_timeout", (err) => resolve(err));
      socket.on("error", (err) => resolve(err));
      socket.connect();
    });

    const error = await withTimeout(connectionPromise, 10000, "Unauthenticated socket connection timed out");
    expect(error).toBeDefined();
  });
});
