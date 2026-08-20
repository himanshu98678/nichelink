const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

jest.setTimeout(60000);

let userAToken, userBToken, userCToken;
let userAId, userBId, userCId;
let conversationId;
let messageId;

beforeAll(async () => {
  const ts = Date.now();

  // Create User A
  const resA = await request(app).post("/api/auth/register").send({
    name: "Msg A",
    username: `msga_msg_${ts}`,
    email: `msga_msg_${ts}@example.com`,
    password: "Password123!",
  });
  userAToken = resA.body.token;
  userAId = resA.body.user.id;

  // Create User B
  const resB = await request(app).post("/api/auth/register").send({
    name: "Msg B",
    username: `msgb_msg_${ts}`,
    email: `msgb_msg_${ts}@example.com`,
    password: "Password123!",
  });
  userBToken = resB.body.token;
  userBId = resB.body.user.id;

  // Create User C
  const resC = await request(app).post("/api/auth/register").send({
    name: "Msg C",
    username: `msgc_msg_${ts}`,
    email: `msgc_msg_${ts}@example.com`,
    password: "Password123!",
  });
  userCToken = resC.body.token;
  userCId = resC.body.user.id;

  // Create direct conversation A-B
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
  // Clean up
  const convIds = [conversationId].filter(Boolean);
  await prisma.messageRead.deleteMany({ where: { userId: { in: [userAId, userBId, userCId].filter(Boolean) } } });
  await prisma.messageReaction.deleteMany({ where: { userId: { in: [userAId, userBId, userCId].filter(Boolean) } } });
  await prisma.messageAttachment.deleteMany({ where: { message: { conversationId: { in: convIds } } } });
  await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
  await prisma.conversationMember.deleteMany({ where: { conversationId: { in: convIds } } });
  await prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId, userCId].filter(Boolean) } } });
  await prisma.$disconnect();
});

describe("Message Actions & Delivery", () => {
  test("1. Send message with attachments", async () => {
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        conversationId,
        content: "Hello from User A about Node.js",
        attachments: [
          {
            url: "https://example.com/file.jpg",
            fileName: "file.jpg",
            fileType: "image/jpeg",
          },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message.content).toBe("Hello from User A about Node.js");
    expect(res.body.message.attachments.length).toBe(1);
    messageId = res.body.message.id;
  });

  test("2. Authorization - non-member (User C) cannot send message in conversation A-B", async () => {
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userCToken}`)
      .send({
        conversationId,
        content: "Illegal message by User C",
      });

    expect(res.statusCode).toBe(403);
  });

  test("3. Edit message", async () => {
    const res = await request(app)
      .patch(`/api/messages/${messageId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ content: "Updated Hello message" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message.content).toBe("Updated Hello message");
    expect(res.body.message.isEdited).toBe(true);
  });

  test("4. Get conversation messages pagination (newest last)", async () => {
    // Send one more message from B to A
    await prisma.message.create({
      data: {
        conversationId,
        senderId: userBId,
        content: "Reply from User B",
      },
    });

    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages?page=1&limit=10`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(2);
    // Order inside items must be chronological (older first, newer last)
    const msg1 = res.body.items[0];
    const msg2 = res.body.items[1];
    expect(new Date(msg1.createdAt).getTime()).toBeLessThanOrEqual(new Date(msg2.createdAt).getTime());
  });

  test("5. Search messages across conversations", async () => {
    const res = await request(app)
      .get("/api/messages/search?q=Updated")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.items.some((i) => i.id === messageId)).toBe(true);
  });

  test("6. Mark message as seen", async () => {
    const res = await request(app)
      .post(`/api/messages/${messageId}/read`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("7. Soft delete message", async () => {
    const res = await request(app)
      .delete(`/api/messages/${messageId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it is soft-deleted in DB
    const dbMsg = await prisma.message.findUnique({ where: { id: messageId } });
    expect(dbMsg.isDeleted).toBe(true);
    expect(dbMsg.content).toBe("This message was deleted");
  });
});
