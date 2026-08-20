const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

jest.setTimeout(60000);

let employerToken, candidateToken, otherToken;
let employerId, candidateId, otherId;
let jobId;
let applicationId;

beforeAll(async () => {
  const ts = Date.now();

  // Create Employer
  const resEmp = await request(app).post("/api/auth/register").send({
    name: "Employer Boss",
    username: `emp_${ts}`,
    email: `emp_${ts}@example.com`,
    password: "Password123!",
  });
  employerToken = resEmp.body.token;
  employerId = resEmp.body.user.id;

  // Create Candidate
  const resCand = await request(app).post("/api/auth/register").send({
    name: "Candidate Seeker",
    username: `cand_${ts}`,
    email: `cand_${ts}@example.com`,
    password: "Password123!",
  });
  candidateToken = resCand.body.token;
  candidateId = resCand.body.user.id;

  // Create other user
  const resOther = await request(app).post("/api/auth/register").send({
    name: "Other Bystander",
    username: `oth_${ts}`,
    email: `oth_${ts}@example.com`,
    password: "Password123!",
  });
  otherToken = resOther.body.token;
  otherId = resOther.body.user.id;

  // Create Job listing
  const job = await prisma.job.create({
    data: {
      title: "Rust Core Developer",
      company: "Rust Foundation",
      postedById: employerId,
      status: "OPEN",
    },
  });
  jobId = job.id;
});

afterAll(async () => {
  await prisma.notification.deleteMany({
    where: { recipientId: { in: [employerId, candidateId, otherId].filter(Boolean) } },
  });
  await prisma.jobApplication.deleteMany({
    where: { jobId },
  });
  await prisma.job.deleteMany({
    where: { id: jobId },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [employerId, candidateId, otherId].filter(Boolean) } },
  });
  await prisma.$disconnect();
});

describe("Job Board System - Job Applications & Notifications", () => {
  test("1. Apply for Job", async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        resumeUrl: "https://example.com/cv.pdf",
        coverLetter: "I write fast Rust programs.",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.application.jobId).toBe(jobId);
    applicationId = res.body.application.id;

    // Verify notification was sent to employer
    const notifications = await prisma.notification.findMany({
      where: { recipientId: employerId, type: "JOB_APPLICATION" },
    });
    expect(notifications.length).toBe(1);
    expect(notifications[0].referenceId).toBe(applicationId);
  });

  test("2. Prevent duplicate applications", async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        resumeUrl: "https://example.com/another.pdf",
      });

    expect(res.statusCode).toBe(400);
  });

  test("3. List applications - Candidate vs Employer access control", async () => {
    // 3a. Candidate lists own applications
    const resCandidate = await request(app)
      .get("/api/applications")
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(resCandidate.statusCode).toBe(200);
    expect(resCandidate.body.items.length).toBe(1);
    expect(resCandidate.body.items[0].id).toBe(applicationId);

    // 3b. Employer lists applications for their job
    const resEmployer = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set("Authorization", `Bearer ${employerToken}`);

    expect(resEmployer.statusCode).toBe(200);
    expect(resEmployer.body.items.length).toBe(1);
    expect(resEmployer.body.items[0].id).toBe(applicationId);

    // 3c. Unauthorized user listing employer's job applications -> 403
    const resForbidden = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(resForbidden.statusCode).toBe(403);
  });

  test("4. Employer updates application status & triggers notification", async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set("Authorization", `Bearer ${employerToken}`)
      .send({ status: "ACCEPTED" });

    expect(res.statusCode).toBe(200);
    expect(res.body.application.status).toBe("ACCEPTED");

    // Verify candidate received acceptance notification (type: SYSTEM)
    const notifications = await prisma.notification.findMany({
      where: { recipientId: candidateId, type: "SYSTEM" },
    });
    expect(notifications.length).toBe(1);
    expect(notifications[0].referenceId).toBe(applicationId);
    expect(notifications[0].title).toContain("Accepted");
  });

  test("4a. Invalid application status transition is rejected", async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set("Authorization", `Bearer ${employerToken}`)
      .send({ status: "PENDING" });

    expect(res.statusCode).toBe(400);
  });

  test("5. Candidate withdraws application", async () => {
    const res = await request(app)
      .delete(`/api/jobs/${jobId}/apply`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(res.statusCode).toBe(200);

    // Check application was deleted
    const appRecord = await prisma.jobApplication.findUnique({ where: { id: applicationId } });
    expect(appRecord).toBeNull();
  });
});
