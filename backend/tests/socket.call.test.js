const { io } = require("socket.io-client");
const request = require("supertest");
const http = require("http");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");
const { initSocket } = require("../src/socket");

jest.setTimeout(60000);

const waitFor = (promise, message) => {
  let timeout;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error(message)), 10000); }),
  ]).finally(() => clearTimeout(timeout));
};

let server;
let address;
let tokenA;
let tokenB;
let tokenC;
let userA;
let userB;
let userC;
let conversationId;
let sockets = [];

const connect = (token) => {
  const socket = io(`http://localhost:${address.port}`, { auth: { token }, transports: ["websocket"], reconnection: false });
  sockets.push(socket);
  return waitFor(new Promise((resolve, reject) => {
    const onReady = () => { socket.off("connect_error", reject); resolve(socket); };
    socket.once("socket:ready", onReady);
    socket.once("connect_error", reject);
  }), "Socket did not become ready");
};

beforeAll(async () => {
  const suffix = Date.now().toString().slice(-6);
  server = http.createServer(app);
  initSocket(server);
  await new Promise((resolve) => server.listen(0, () => { address = server.address(); resolve(); }));

  const register = async (prefix) => request(app).post("/api/auth/register").send({
    name: `Call ${prefix}`, username: `call_${prefix.toLowerCase()}_${suffix}`, email: `call_${prefix.toLowerCase()}_${suffix}@example.com`, password: "Password123!",
  });
  const [resA, resB, resC] = await Promise.all([register("A"), register("B"), register("C")]);
  tokenA = resA.body.token; tokenB = resB.body.token; tokenC = resC.body.token;
  userA = resA.body.user; userB = resB.body.user; userC = resC.body.user;
  const conversation = await prisma.conversation.create({ data: { isGroup: false, participants: { create: [{ userId: userA.id }, { userId: userB.id }] } } });
  conversationId = conversation.id;
});

afterEach(() => {
  sockets.forEach((socket) => socket.disconnect());
  sockets = [];
});

afterAll(async () => {
  await prisma.conversationMember.deleteMany({ where: { conversationId } });
  await prisma.conversation.deleteMany({ where: { id: conversationId } });
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id, userC.id] } } });
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

describe("Socket.IO WebRTC call signaling", () => {
  test("initiates, accepts, forwards offer/answer/ICE, and ends a call", async () => {
    const socketA = await connect(tokenA);
    const socketB = await connect(tokenB);
    const incoming = waitFor(new Promise((resolve) => socketB.once("call:incoming", resolve)), "Incoming call missing");

    const started = await new Promise((resolve) => socketA.emit("call:initiate", { conversationId, callType: "video" }, resolve));
    expect(started.success).toBe(true);
    const call = await incoming;
    expect(call.callType).toBe("video");
    expect(call.caller.id).toBe(userA.id);

    const accepted = await new Promise((resolve) => socketB.emit("call:accept", { callId: call.callId, conversationId }, resolve));
    expect(accepted.success).toBe(true);
    const offerPromise = waitFor(new Promise((resolve) => socketB.once("call:offer", resolve)), "Offer missing");
    socketA.emit("call:offer", { callId: call.callId, conversationId, offer: { type: "offer", sdp: "test" } });
    expect((await offerPromise).offer.type).toBe("offer");

    const answerPromise = waitFor(new Promise((resolve) => socketA.once("call:answer", resolve)), "Answer missing");
    socketB.emit("call:answer", { callId: call.callId, conversationId, answer: { type: "answer", sdp: "test" } });
    expect((await answerPromise).answer.type).toBe("answer");

    const icePromise = waitFor(new Promise((resolve) => socketB.once("call:ice-candidate", resolve)), "ICE candidate missing");
    socketA.emit("call:ice-candidate", { callId: call.callId, conversationId, candidate: { candidate: "candidate:test" } });
    expect((await icePromise).candidate.candidate).toBe("candidate:test");

    const ended = waitFor(new Promise((resolve) => socketB.once("call:ended", resolve)), "Call end missing");
    const endedResponse = await new Promise((resolve) => socketA.emit("call:end", { callId: call.callId, conversationId }, resolve));
    expect(endedResponse.success).toBe(true);
    expect((await ended).userId).toBe(userA.id);
  });

  test("rejects unauthorized calls and invalid signaling payloads", async () => {
    const socketC = await connect(tokenC);
    const unauthorized = await new Promise((resolve) => socketC.emit("call:initiate", { conversationId, callType: "voice" }, resolve));
    expect(unauthorized.success).toBe(false);

    const socketA = await connect(tokenA);
    const invalid = await new Promise((resolve) => socketA.emit("call:offer", { conversationId, offer: {} }, resolve));
    expect(invalid.success).toBe(false);
  });

  test("ends the call when a participant disconnects", async () => {
    const socketA = await connect(tokenA);
    const socketB = await connect(tokenB);
    const incoming = waitFor(new Promise((resolve) => socketB.once("call:incoming", resolve)), "Incoming call missing");
    socketA.emit("call:initiate", { conversationId, callType: "voice" });
    const call = await incoming;
    const ended = waitFor(new Promise((resolve) => socketB.once("call:ended", resolve)), "Disconnect cleanup missing");
    socketA.disconnect();
    expect((await ended).reason).toBe("socket-disconnected");
    expect(call.callId).toBeTruthy();
  });
});