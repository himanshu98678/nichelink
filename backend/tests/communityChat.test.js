const { io } = require("socket.io-client");
const request = require("supertest");
const http = require("http");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");
const { initSocket } = require("../src/socket");

jest.setTimeout(60000);

const waitFor = (promise, message) => {
  let timeout;
  return Promise.race([promise, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error(message)), 10000); })]).finally(() => clearTimeout(timeout));
};

let server;
let address;
let ownerToken;
let memberToken;
let outsiderToken;
let ownerId;
let memberId;
let outsiderId;
let communityId;
let channelId;
let sockets = [];

const connect = (token) => {
  const socket = io(`http://localhost:${address.port}`, { auth: { token }, transports: ["websocket"], reconnection: false });
  sockets.push(socket);
  return waitFor(new Promise((resolve, reject) => {
    socket.once("socket:ready", () => resolve(socket));
    socket.once("connect_error", reject);
  }), "Socket did not become ready");
};

beforeAll(async () => {
  const suffix = Date.now().toString().slice(-6);
  server = http.createServer(app);
  initSocket(server);
  await new Promise((resolve) => server.listen(0, () => { address = server.address(); resolve(); }));
  const register = (prefix) => request(app).post("/api/auth/register").send({
    name: `Chat ${prefix}`, username: `chat_${prefix.toLowerCase()}_${suffix}`, email: `chat_${prefix.toLowerCase()}_${suffix}@example.com`, password: "Password123!",
  });
  const [owner, member, outsider] = await Promise.all([register("Owner"), register("Member"), register("Outsider")]);
  ownerToken = owner.body.token; memberToken = member.body.token; outsiderToken = outsider.body.token;
  ownerId = owner.body.user.id; memberId = member.body.user.id; outsiderId = outsider.body.user.id;
  const community = await request(app).post("/api/communities").set("Authorization", `Bearer ${ownerToken}`).send({ name: `Chat Community ${suffix}`, visibility: "public" });
  expect(community.statusCode).toBe(201);
  communityId = community.body.community.id;
});

afterEach(() => {
  sockets.forEach((socket) => socket.disconnect());
  sockets = [];
});

afterAll(async () => {
  await prisma.community.deleteMany({ where: { id: communityId } });
  await prisma.user.deleteMany({ where: { id: { in: [ownerId, memberId, outsiderId] } } });
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

describe("Community Chat", () => {
  test("creates a default channel and protects access until join", async () => {
    const channels = await request(app).get(`/api/community-chat/communities/${communityId}/channels`).set("Authorization", `Bearer ${ownerToken}`);
    expect(channels.statusCode).toBe(200);
    expect(channels.body.channels).toHaveLength(1);
    channelId = channels.body.channels[0].id;

    const outsiderHistory = await request(app).get(`/api/community-chat/channels/${channelId}/messages`).set("Authorization", `Bearer ${outsiderToken}`);
    expect(outsiderHistory.statusCode).toBe(403);
    const join = await request(app).post(`/api/community-chat/channels/${channelId}/join`).set("Authorization", `Bearer ${memberToken}`);
    expect(join.statusCode).toBe(201);
  });

  test("sends and reads persisted community messages", async () => {
    const sent = await request(app).post(`/api/community-chat/channels/${channelId}/messages`).set("Authorization", `Bearer ${ownerToken}`).send({ content: "Welcome to the community channel" });
    expect(sent.statusCode).toBe(201);
    expect(sent.body.message.senderId).toBe(ownerId);
    const history = await request(app).get(`/api/community-chat/channels/${channelId}/messages?limit=20`).set("Authorization", `Bearer ${memberToken}`);
    expect(history.statusCode).toBe(200);
    expect(history.body.items.some((message) => message.id === sent.body.message.id)).toBe(true);
  });

  test("delivers real-time messages and rejects malformed/unauthorized socket events", async () => {
    const ownerSocket = await connect(ownerToken);
    const memberSocket = await connect(memberToken);
    const outsiderSocket = await connect(outsiderToken);
    const received = waitFor(new Promise((resolve) => memberSocket.once("community:message:new", resolve)), "Community message event missing");
    const response = await new Promise((resolve) => ownerSocket.emit("community:message:send", { channelId, content: "Live community message" }, resolve));
    expect(response.success).toBe(true);
    expect((await received).message.senderId).toBe(ownerId);

    const invalid = await new Promise((resolve) => ownerSocket.emit("community:message:send", { channelId }, resolve));
    expect(invalid.success).toBe(false);
    const unauthorized = await new Promise((resolve) => outsiderSocket.emit("community:message:send", { channelId, content: "No access" }, resolve));
    expect(unauthorized.success).toBe(false);
  });

  test("supports ownership-safe edit/delete and leave", async () => {
    const sent = await request(app).post(`/api/community-chat/channels/${channelId}/messages`).set("Authorization", `Bearer ${memberToken}`).send({ content: "Member message" });
    const forbidden = await request(app).patch(`/api/community-chat/channels/${channelId}/messages/${sent.body.message.id}`).set("Authorization", `Bearer ${ownerToken}`).send({ content: "Impersonated edit" });
    expect(forbidden.statusCode).toBe(403);
    const edited = await request(app).patch(`/api/community-chat/channels/${channelId}/messages/${sent.body.message.id}`).set("Authorization", `Bearer ${memberToken}`).send({ content: "Edited member message" });
    expect(edited.statusCode).toBe(200);
    const left = await request(app).delete(`/api/community-chat/channels/${channelId}/leave`).set("Authorization", `Bearer ${memberToken}`);
    expect(left.statusCode).toBe(200);
    const afterLeave = await request(app).post(`/api/community-chat/channels/${channelId}/messages`).set("Authorization", `Bearer ${memberToken}`).send({ content: "Should fail" });
    expect(afterLeave.statusCode).toBe(403);
  });
});