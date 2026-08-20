const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

describe("Dashboard analytics", () => {
  let token;
  let userId;
  let projectId;

  beforeAll(async () => {
    const suffix = Date.now().toString().slice(-6);
    const user = await request(app).post("/api/auth/register").send({
      name: "Analytics User", username: `analytics${suffix}`, email: `analytics${suffix}@example.com`, password: "Password123!",
    });
    expect(user.statusCode).toBe(201);
    token = user.body.token;
    userId = user.body.user.id;

    const project = await prisma.project.create({
      data: {
        title: "Analytics Project", ownerId: userId, status: "ACTIVE",
        members: { create: [{ userId, role: "OWNER" }] },
        tasks: {
          create: [
            { title: "Done task", status: "DONE", priority: "MEDIUM" },
            { title: "Open task", status: "TODO", priority: "LOW" },
          ],
        },
      },
    });
    projectId = project.id;
    const task = await prisma.task.findFirst({ where: { projectId, status: "DONE" } });
    const end = new Date(Date.now() - 1800000);
    const start = new Date(Date.now() - 5400000);
    await prisma.timeEntry.create({ data: { projectId, taskId: task.id, userId, startedAt: start, endedAt: end, accumulatedSeconds: 3600, durationMinutes: 60, status: "COMPLETED" } });
    await prisma.job.create({ data: { title: "Analytics Job", company: "Example Co", postedById: userId, status: "OPEN" } });
    await prisma.subscription.create({ data: { userId, planCode: "PRO", status: "ACTIVE" } });
    const community = await prisma.community.create({ data: { name: "Analytics Community", slug: `analytics-${suffix}`, ownerId: userId, members: { create: [{ userId, role: "OWNER" }] } } });
    const conversation = await prisma.conversation.create({ data: { isGroup: false, participants: { create: [{ userId }] } } });
    await prisma.message.create({
      data: {
        conversation: { connect: { id: conversation.id } },
        sender: { connect: { id: userId } },
        content: "Analytics message",
      },
    });
    expect(community.id).toBeTruthy();
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => null);
    await prisma.$disconnect();
  });

  test("requires authentication", async () => {
    const response = await request(app).get("/api/dashboard/analytics");
    expect(response.statusCode).toBe(401);
  });

  test("returns server-calculated project, task, job, time, activity, and billing metrics", async () => {
    const response = await request(app).get("/api/dashboard/analytics?period=month").set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.analytics.metrics.projects.total).toBe(1);
    expect(response.body.analytics.metrics.projects.byStatus.ACTIVE).toBe(1);
    expect(response.body.analytics.metrics.tasks).toMatchObject({ total: 2, completed: 1, pending: 1, completionRate: 50 });
    expect(response.body.analytics.metrics.jobs).toMatchObject({ total: 1, byStatus: { OPEN: 1 } });
    expect(response.body.analytics.metrics.trackedTime.seconds).toBe(3600);
    expect(response.body.analytics.metrics.trackedTime.hours).toBe(1);
    expect(response.body.analytics.metrics.messagesSent).toBe(1);
    expect(response.body.analytics.metrics.communitiesJoined).toBe(1);
    expect(response.body.analytics.metrics.subscription).toMatchObject({ planCode: "PRO", status: "ACTIVE" });
    expect(response.body.analytics.time.byProject[0]).toMatchObject({ projectId, seconds: 3600 });
    expect(response.body.analytics.time.byDay).toHaveLength(1);
  });

  test("returns empty-safe analytics for a user with no data", async () => {
    const suffix = `${Date.now()}x`;
    const user = await request(app).post("/api/auth/register").send({ name: "Empty Analytics", username: `empty${suffix.slice(-7)}`, email: `empty${suffix}@example.com`, password: "Password123!" });
    const response = await request(app).get("/api/dashboard/analytics?period=week").set("Authorization", `Bearer ${user.body.token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.analytics.metrics.projects.total).toBe(0);
    expect(response.body.analytics.metrics.trackedTime.seconds).toBe(0);
    expect(response.body.analytics.time.byProject).toEqual([]);
    await prisma.user.delete({ where: { id: user.body.user.id } });
  });
});