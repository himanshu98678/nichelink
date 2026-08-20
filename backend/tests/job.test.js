const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

jest.setTimeout(60000);

let userAToken, userBToken;
let userAId, userBId;
let jobId;

beforeAll(async () => {
  const ts = Date.now();

  // Create User A (Employer)
  const resA = await request(app).post("/api/auth/register").send({
    name: "Job Owner",
    username: `jobowner_${ts}`,
    email: `jobowner_${ts}@example.com`,
    password: "Password123!",
  });
  userAToken = resA.body.token;
  userAId = resA.body.user.id;

  // Create User B (Job Seeker)
  const resB = await request(app).post("/api/auth/register").send({
    name: "Job Seeker",
    username: `jobseeker_${ts}`,
    email: `jobseeker_${ts}@example.com`,
    password: "Password123!",
  });
  userBToken = resB.body.token;
  userBId = resB.body.user.id;
});

afterAll(async () => {
  await prisma.savedJob.deleteMany({
    where: { userId: { in: [userAId, userBId].filter(Boolean) } },
  });
  await prisma.jobApplication.deleteMany({
    where: { userId: { in: [userAId, userBId].filter(Boolean) } },
  });
  await prisma.job.deleteMany({
    where: { postedById: { in: [userAId, userBId].filter(Boolean) } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [userAId, userBId].filter(Boolean) } },
  });
  await prisma.$disconnect();
});

describe("Job Board System - Job CRUD & Saved Jobs", () => {
  test("1. Create Job (Authenticated only)", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "Frontend Developer",
        description: "Looking for an expert React developer",
        company: "Google Inc.",
        location: "Mountain View, CA",
        employmentType: "Full-time",
        experienceLevel: "Senior",
        salaryMin: 120000,
        salaryMax: 180000,
        skills: ["React", "TypeScript", "Redux"],
        category: "Software Engineering",
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.job.title).toBe("Frontend Developer");
    jobId = res.body.job.id;
  });

  test("1a. Unauthenticated job creation should fail", async () => {
    const res = await request(app).post("/api/jobs").send({ title: "No Auth" });
    expect(res.statusCode).toBe(401);
  });

  test("2. Update Job (Only owner/admin)", async () => {
    // Non-owner updates -> 403
    const resForbidden = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ title: "Hack the Job" });

    expect(resForbidden.statusCode).toBe(403);

    // Owner updates -> 200
    const resOk = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "Senior Frontend Engineer",
        status: "OPEN",
      });

    expect(resOk.statusCode).toBe(200);
    expect(resOk.body.job.title).toBe("Senior Frontend Engineer");
  });

  test("3. Get Single Job", async () => {
    const res = await request(app).get(`/api/jobs/${jobId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.job.title).toBe("Senior Frontend Engineer");
  });

  test("4. List & Search Jobs with sorting, filtering, and pagination", async () => {
    const res = await request(app)
      .get("/api/jobs?keyword=Senior&location=Mountain%20View&company=Google&sort=salary&limit=5")
      .expect(200);

    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].id).toBe(jobId);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
    expect(res.body.hasNext).toBe(false);
  });

  test("5. Search jobs by skills and category", async () => {
    const res = await request(app)
      .get("/api/jobs?skills=React,TypeScript&category=Software%20Engineering")
      .expect(200);

    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].id).toBe(jobId);
  });

  test("6. Save Job & Prevent duplicate saves", async () => {
    // Save job
    const resSave = await request(app)
      .post(`/api/jobs/${jobId}/save`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resSave.statusCode).toBe(201);
    expect(resSave.body.saved.jobId).toBe(jobId);

    // Duplicate save -> 400
    const resDuplicate = await request(app)
      .post(`/api/jobs/${jobId}/save`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resDuplicate.statusCode).toBe(400);

    // List saved jobs
    const resList = await request(app)
      .get("/api/saved-jobs")
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resList.statusCode).toBe(200);
    expect(resList.body.items.length).toBe(1);
    expect(resList.body.items[0].id).toBe(jobId);
  });

  test("6. Remove Saved Job", async () => {
    const resRemove = await request(app)
      .delete(`/api/jobs/${jobId}/save`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resRemove.statusCode).toBe(200);

    const resList = await request(app)
      .get("/api/saved-jobs")
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resList.statusCode).toBe(200);
    expect(resList.body.items.length).toBe(0);
  });

  test("7. Delete Job (Only owner/admin)", async () => {
    // Non-owner deletes -> 403
    const resForbidden = await request(app)
      .delete(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resForbidden.statusCode).toBe(403);

    // Owner deletes -> 200
    const resOk = await request(app)
      .delete(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(resOk.statusCode).toBe(200);

    // Get single -> 404
    const res404 = await request(app).get(`/api/jobs/${jobId}`);
    expect(res404.statusCode).toBe(404);
  });
});
