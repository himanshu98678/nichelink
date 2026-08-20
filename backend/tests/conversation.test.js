const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

jest.setTimeout(60000);

let userAToken, userBToken, userCToken;
let userAId, userBId, userCId;
let directConvId, groupConvId;

beforeAll(async () => {
  const ts = Date.now();

  // Create User A
  const resA = await request(app).post("/api/auth/register").send({
    name: "Msg User A",
    username: `msga_${ts}`,
    email: `msga_${ts}@example.com`,
    password: "Password123!",
  });
  userAToken = resA.body.token;
  userAId = resA.body.user.id;

  // Create User B
  const resB = await request(app).post("/api/auth/register").send({
    name: "Msg User B",
    username: `msgb_${ts}`,
    email: `msgb_${ts}@example.com`,
    password: "Password123!",
  });
  userBToken = resB.body.token;
  userBId = resB.body.user.id;

  // Create User C
  const resC = await request(app).post("/api/auth/register").send({
    name: "Msg User C",
    username: `msgc_${ts}`,
    email: `msgc_${ts}@example.com`,
    password: "Password123!",
  });
  userCToken = resC.body.token;
  userCId = resC.body.user.id;
});

afterAll(async () => {
  // Clean up
  const convs = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: { in: [userAId, userBId, userCId].filter(Boolean) } } },
    },
    select: { id: true },
  });
  const convIds = convs.map((c) => c.id);

  await prisma.messageRead.deleteMany({ where: { userId: { in: [userAId, userBId, userCId].filter(Boolean) } } });
  await prisma.messageReaction.deleteMany({ where: { userId: { in: [userAId, userBId, userCId].filter(Boolean) } } });
  await prisma.messageAttachment.deleteMany({ where: { message: { conversationId: { in: convIds } } } });
  await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
  await prisma.conversationMember.deleteMany({ where: { conversationId: { in: convIds } } });
  await prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId, userCId].filter(Boolean) } } });
  await prisma.$disconnect();
});

describe("Conversations Management System", () => {
  test("1. Create 1-to-1 conversation", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ isGroup: false, targetUserId: userBId });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.conversation).toHaveProperty("id");
    expect(res.body.conversation.isGroup).toBe(false);
    directConvId = res.body.conversation.id;
  });

  test("2. Reuse existing 1-to-1 conversation", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ isGroup: false, targetUserId: userBId });

    expect(res.statusCode).toBe(201);
    expect(res.body.conversation.id).toBe(directConvId);
  });

  test("3. Create Group conversation", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        isGroup: true,
        name: "Test Messaging Group",
        memberIds: [userBId],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.conversation.isGroup).toBe(true);
    expect(res.body.conversation.name).toBe("Test Messaging Group");
    expect(res.body.conversation.ownerId).toBe(userAId);
    groupConvId = res.body.conversation.id;
  });

  test("4. Add members to group conversation", async () => {
    const res = await request(app)
      .post(`/api/conversations/${groupConvId}/members`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ memberIds: [userCId] });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const members = res.body.conversation.participants.map((p) => p.userId);
    expect(members).toContain(userCId);
  });

  test("5. Rename group chat", async () => {
    const res = await request(app)
      .patch(`/api/conversations/${groupConvId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ name: "Renamed Test Group" });

    expect(res.statusCode).toBe(200);
    expect(res.body.conversation.name).toBe("Renamed Test Group");
  });

  test("6. Leave / Remove member from group", async () => {
    // User C leaves group
    const resLeave = await request(app)
      .delete(`/api/conversations/${groupConvId}/members/${userCId}`)
      .set("Authorization", `Bearer ${userCToken}`);

    expect(resLeave.statusCode).toBe(200);

    const members = resLeave.body.conversation.participants.map((p) => p.userId);
    expect(members).not.toContain(userCId);
  });

  test("7. List user conversations with pagination", async () => {
    const res = await request(app)
      .get("/api/conversations?page=1&limit=10")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  test("8. Authorization - non-member cannot access conversation detail", async () => {
    const res = await request(app)
      .get(`/api/conversations/${groupConvId}`)
      .set("Authorization", `Bearer ${userCToken}`); // C left the group

    expect(res.statusCode).toBe(403);
  });

  test("9. Delete group (owner only)", async () => {
    // Non-owner (B) attempts deletion
    const resFail = await request(app)
      .delete(`/api/conversations/${groupConvId}`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resFail.statusCode).toBe(403);

    // Owner (A) deletes group
    const resSuccess = await request(app)
      .delete(`/api/conversations/${groupConvId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(resSuccess.statusCode).toBe(200);
  });
});
