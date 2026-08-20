const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");
const { followUser, applyToJob } = require("../src/services/userService");

jest.setTimeout(60000);

let userAToken, userBToken, userCToken;
let userAId, userBId, userCId;
let userCEmail;
let postId, commentId, jobId, communityId, projectId, conversationId;
let notificationId;

beforeAll(async () => {
  const ts = Date.now();

  // Create User A
  const resA = await request(app).post("/api/auth/register").send({
    name: "Notif User A",
    username: `notifa_${ts}`,
    email: `notifa_${ts}@example.com`,
    password: "Password123!",
  });
  userAToken = resA.body.token;
  userAId = resA.body.user.id;

  // Create User B
  const resB = await request(app).post("/api/auth/register").send({
    name: "Notif User B",
    username: `notifb_${ts}`,
    email: `notifb_${ts}@example.com`,
    password: "Password123!",
  });
  userBToken = resB.body.token;
  userBId = resB.body.user.id;

  // Create User C (third party/non-owner)
  userCEmail = `notifc_${ts}@example.com`;
  const resC = await request(app).post("/api/auth/register").send({
    name: "Notif User C",
    username: `notifc_${ts}`,
    email: userCEmail,
    password: "Password123!",
  });
  userCToken = resC.body.token;
  userCId = resC.body.user.id;

  // User B creates a post
  const post = await prisma.post.create({
    data: {
      authorId: userBId,
      content: "Initial post by B",
    },
  });
  postId = post.id;

  // User B creates a job
  const job = await prisma.job.create({
    data: {
      title: "Backend Engineer",
      company: "Acme Corp",
      postedById: userBId,
    },
  });
  jobId = job.id;

  // Create a community owned by B for invite testing
  const community = await prisma.community.create({
    data: {
      name: `Notif Community ${ts}`,
      slug: `notif-community-${ts}`,
      description: "A community for notification tests",
      visibility: "public",
      ownerId: userBId,
      members: { create: [{ userId: userBId, role: "OWNER" }] },
    },
  });
  communityId = community.id;

  // Create a project owned by A for project notification tests
  const project = await prisma.project.create({
    data: {
      title: `Notif Project ${ts}`,
      description: "A project for notification tests",
      ownerId: userAId,
      members: { create: [{ userId: userAId, role: "OWNER" }] },
    },
  });
  projectId = project.id;

  // Create a direct conversation between A and B for message notifications
  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: { create: [{ userId: userAId }, { userId: userBId }] },
    },
  });
  conversationId = conversation.id;
});

afterAll(async () => {
  // Clean up notifications and items
  await prisma.notification.deleteMany({
    where: {
      recipientId: { in: [userAId, userBId, userCId].filter(Boolean) },
    },
  });
  await prisma.jobApplication.deleteMany({
    where: { jobId },
  });
  await prisma.job.deleteMany({
    where: { id: jobId },
  });
  await prisma.comment.deleteMany({
    where: { postId },
  });
  await prisma.postLike.deleteMany({
    where: { postId },
  });
  await prisma.post.deleteMany({
    where: { id: postId },
  });
  await prisma.projectMember.deleteMany({
    where: { projectId },
  });
  await prisma.project.deleteMany({
    where: { id: projectId },
  });
  await prisma.communityMember.deleteMany({
    where: { communityId },
  });
  await prisma.communityInvite.deleteMany({
    where: { communityId },
  });
  await prisma.community.deleteMany({
    where: { id: communityId },
  });
  await prisma.conversation.deleteMany({
    where: { id: conversationId },
  });
  await prisma.userFollow.deleteMany({
    where: { OR: [{ followerId: userAId }, { followerId: userBId }] },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [userAId, userBId, userCId].filter(Boolean) } },
  });
  await prisma.$disconnect();
});

describe("Notification System Integration", () => {
  test("1. Trigger LIKE notification", async () => {
    // User A likes User B's post
    const res = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.liked).toBe(true);

    // Verify B received a LIKE notification
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userBId, type: "LIKE" },
    });
    expect(notifications.length).toBe(1);
    expect(notifications[0].referenceId).toBe(postId);
    notificationId = notifications[0].id;
  });

  test("2. Trigger COMMENT, REPLY, and MENTION notifications", async () => {
    // User A comments on User B's post mentioning User C (@notifc_)
    const matches = await prisma.user.findUnique({ where: { id: userCId } });
    const resComment = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ content: `Nice post @${matches.username}` });

    expect(resComment.statusCode).toBe(201);
    commentId = resComment.body.comment.id;

    // Verify B received a COMMENT notification
    const commentNotifs = await prisma.notification.findMany({
      where: { recipientId: userBId, type: "COMMENT" },
    });
    expect(commentNotifs.length).toBe(1);

    // Verify C received a MENTION notification
    const mentionNotifs = await prisma.notification.findMany({
      where: { recipientId: userCId, type: "MENTION" },
    });
    expect(mentionNotifs.length).toBe(1);

    // User B replies to User A's comment
    const resReply = await request(app)
      .post(`/api/comments/${commentId}/reply`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ content: "Thanks A!" });

    expect(resReply.statusCode).toBe(201);

    // Verify A received a REPLY notification
    const replyNotifs = await prisma.notification.findMany({
      where: { recipientId: userAId, type: "REPLY" },
    });
    expect(replyNotifs.length).toBe(1);
  });

  test("3. Trigger FOLLOW notification", async () => {
    // User A follows User B
    await followUser(userAId, userBId);

    // Verify B received a FOLLOW notification
    const followNotifs = await prisma.notification.findMany({
      where: { recipientId: userBId, type: "FOLLOW" },
    });
    expect(followNotifs.length).toBe(1);
  });

  test("4. Trigger JOB_APPLICATION notification", async () => {
    // User A applies to User B's job
    await applyToJob(userAId, jobId, "https://example.com/resume.pdf");

    // Verify B received a JOB_APPLICATION notification
    const jobNotifs = await prisma.notification.findMany({
      where: { recipientId: userBId, type: "JOB_APPLICATION" },
    });
    expect(jobNotifs.length).toBe(1);
  });

  test("5. Trigger MESSAGE notification", async () => {
    const resSend = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        conversationId,
        content: "Hello B, this is a message notification",
      });

    expect(resSend.statusCode).toBe(201);

    const messageNotifs = await prisma.notification.findMany({
      where: { recipientId: userBId, type: "MESSAGE" },
    });
    expect(messageNotifs.length).toBe(1);
    expect(messageNotifs[0].referenceType).toBe("MESSAGE");
  });

  test("6. Trigger COMMUNITY_INVITE and ACCEPT notifications", async () => {
    const inviteRes = await request(app)
      .post(`/api/communities/${communityId}/invite`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ email: userCEmail });

    expect(inviteRes.statusCode).toBe(200);

    // Since userC exists and has the email address, verify their invite notification
    const inviteNotifs = await prisma.notification.findMany({
      where: { recipientId: userCId, type: "COMMUNITY_INVITE" },
    });
    expect(inviteNotifs.length).toBe(1);
    invitationId = inviteNotifs[0].referenceId;

    const acceptRes = await request(app)
      .post(`/api/communities/invites/${inviteNotifs[0].referenceId}/accept`)
      .set("Authorization", `Bearer ${userCToken}`);

    expect(acceptRes.statusCode).toBe(200);

    const acceptNotifs = await prisma.notification.findMany({
      where: { recipientId: userBId, type: "COMMUNITY_INVITE_ACCEPTED" },
    });
    expect(acceptNotifs.length).toBe(1);
  });

  test("7. Trigger PROJECT_INVITE and PROJECT_REMOVED notifications", async () => {
    const assignRes = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ userId: userBId, role: "MEMBER" });

    expect(assignRes.statusCode).toBe(200);

    const projectInviteNotifs = await prisma.notification.findMany({
      where: { recipientId: userBId, type: "PROJECT_INVITE" },
    });
    expect(projectInviteNotifs.length).toBe(1);

    const memberRecord = await prisma.projectMember.findFirst({ where: { projectId, userId: userBId } });
    expect(memberRecord).toBeTruthy();

    const removeRes = await request(app)
      .delete(`/api/projects/${projectId}/members/${memberRecord.id}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(removeRes.statusCode).toBe(200);

    const removedNotifs = await prisma.notification.findMany({
      where: { recipientId: userBId, type: "PROJECT_REMOVED" },
    });
    expect(removedNotifs.length).toBe(1);
  });

  test("8. Get notifications count and list with pagination & filters", async () => {
    // Get unread count for B
    const resCount = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resCount.statusCode).toBe(200);
    expect(resCount.body.unreadCount).toBeGreaterThanOrEqual(4); // LIKE, COMMENT, FOLLOW, JOB_APPLICATION

    // List notifications for B
    const resList = await request(app)
      .get("/api/notifications?page=1&limit=2")
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resList.statusCode).toBe(200);
    expect(resList.body.items.length).toBe(2);
    expect(resList.body.total).toBeGreaterThanOrEqual(4);
    expect(resList.body.totalPages).toBeGreaterThanOrEqual(2);

    // Filter by type
    const resFiltered = await request(app)
      .get("/api/notifications?type=LIKE")
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resFiltered.statusCode).toBe(200);
    expect(resFiltered.body.items.every((i) => i.type === "LIKE")).toBe(true);
  });

  test("6. Mark notification as read", async () => {
    const res = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notification.isRead).toBe(true);
  });

  test("7. Authorization - cannot read other user's notification", async () => {
    const res = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${userCToken}`);

    expect(res.statusCode).toBe(403);
  });

  test("8. Mark all notifications as read", async () => {
    const res = await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${userBToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const countRes = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${userBToken}`);

    expect(countRes.body.unreadCount).toBe(0);
  });

  test("9. Delete notification by ID and delete all", async () => {
    // Delete single notification
    const resDelete = await request(app)
      .delete(`/api/notifications/${notificationId}`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resDelete.statusCode).toBe(200);

    const dbNotif = await prisma.notification.findUnique({ where: { id: notificationId } });
    expect(dbNotif).toBeNull();

    // Delete all remaining
    const resDeleteAll = await request(app)
      .delete("/api/notifications")
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resDeleteAll.statusCode).toBe(200);

    const allNotifs = await prisma.notification.findMany({ where: { recipientId: userBId } });
    expect(allNotifs.length).toBe(0);
  });
});
