const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

jest.setTimeout(60000);

let authToken;
let userId;
let uploadedFileId;
let uploadedFileUrl;
let pathTraversalFileId;

const randomSuffix = () => Math.random().toString(36).substring(2, 8);

beforeAll(async () => {
  const suffix = Math.random().toString(36).substring(2, 8);
  const res = await request(app).post("/api/auth/register").send({
    name: "Upload Tester",
    username: `upload_tester_${suffix}`,
    email: `upload_tester_${suffix}@example.com`,
    password: "Password123!",
  });

  authToken = res.body.token;
  userId = res.body.user?.id;
});

afterAll(async () => {
  if (uploadedFileId) {
    await prisma.file.deleteMany({ where: { id: uploadedFileId } }).catch(() => null);
  }
  if (pathTraversalFileId) {
    await prisma.file.deleteMany({ where: { id: pathTraversalFileId } }).catch(() => null);
  }
  await prisma.user.deleteMany({ where: { id: userId } }).catch(() => null);
  await prisma.$disconnect();
});

describe("Upload and Media Management", () => {
  test("Upload generic file", async () => {
    const res = await request(app)
      .post("/api/uploads/files")
      .set("Authorization", `Bearer ${authToken}`)
      .field("category", "GENERAL")
      .field("visibility", "PRIVATE")
      .attach("file", Buffer.from("Hello, world!"), "hello.txt");

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.file).toHaveProperty("id");
    expect(res.body.file).toHaveProperty("url");
    expect(res.body.file.fileName).toBe("hello.txt");

    uploadedFileId = res.body.file.id;
    uploadedFileUrl = res.body.file.url;
  });

  test("Reject invalid file type", async () => {
    const res = await request(app)
      .post("/api/uploads/files")
      .set("Authorization", `Bearer ${authToken}`)
      .field("category", "GENERAL")
      .attach("file", Buffer.from("bad"), "malware.exe");

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("Reject invalid MIME type with benign extension", async () => {
    const res = await request(app)
      .post("/api/uploads/files")
      .set("Authorization", `Bearer ${authToken}`)
      .field("category", "GENERAL")
      .attach("file", Buffer.from("bad content"), { filename: "image.png", contentType: "application/x-msdownload" });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("Reject oversized file with allowed extension", async () => {
    const res = await request(app)
      .post("/api/uploads/files")
      .set("Authorization", `Bearer ${authToken}`)
      .field("category", "GENERAL")
      .attach("file", Buffer.alloc(51 * 1024 * 1024), "oversized.txt");

    expect([413, 400]).toContain(res.statusCode);
  });

  test("Reject malformed metadata", async () => {
    const res = await request(app)
      .post("/api/uploads/files")
      .set("Authorization", `Bearer ${authToken}`)
      .field("category", "GENERAL")
      .field("metadata", "{invalidJson}")
      .attach("file", Buffer.from("Hello"), "hello.txt");

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("Sanitize path traversal naming", async () => {
    const res = await request(app)
      .post("/api/uploads/files")
      .set("Authorization", `Bearer ${authToken}`)
      .field("category", "GENERAL")
      .field("visibility", "PRIVATE")
      .attach("file", Buffer.from("x"), "../../evil.txt");

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.file.fileName).toBe("evil.txt");
    pathTraversalFileId = res.body.file.id;
  });

  test("Authorized download works", async () => {
    const res = await request(app)
      .get(`/api/uploads/files/${uploadedFileId}/download`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/plain|application\/octet-stream|application\/pdf|image/);
  });

  test("Unauthorized download is rejected", async () => {
    const suffix = randomSuffix();
    const otherUser = await request(app).post("/api/auth/register").send({
      name: "Other User",
      username: `other_user_${suffix}`,
      email: `other_user_${suffix}@example.com`,
      password: "Password123!",
    });

    if (otherUser.statusCode !== 201) {
      console.error("Unauthorized download user registration failed", otherUser.statusCode, otherUser.body);
    }
    expect(otherUser.statusCode).toBe(201);
    expect(otherUser.body.token).toBeDefined();

    const res = await request(app)
      .get(`/api/uploads/files/${uploadedFileId}/download`)
      .set("Authorization", `Bearer ${otherUser.body.token}`);

    expect(res.statusCode).toBe(403);
  });

  test("Reject unauthorized deletion of another user's file", async () => {
    const suffix = randomSuffix();
    const otherUser = await request(app).post("/api/auth/register").send({
      name: "Delete Attacker",
      username: `delete_attacker_${suffix}`,
      email: `delete_attacker_${suffix}@example.com`,
      password: "Password123!",
    });

    if (otherUser.statusCode !== 201) {
      console.error("Unauthorized delete user registration failed", otherUser.statusCode, otherUser.body);
    }
    expect(otherUser.statusCode).toBe(201);
    expect(otherUser.body.token).toBeDefined();

    const res = await request(app)
      .delete(`/api/uploads/files/${uploadedFileId}`)
      .set("Authorization", `Bearer ${otherUser.body.token}`);

    expect(res.statusCode).toBe(403);
  });

  test("Public file download works without authentication", async () => {
    const publicUpload = await request(app)
      .post("/api/uploads/files")
      .set("Authorization", `Bearer ${authToken}`)
      .field("category", "GENERAL")
      .field("visibility", "PUBLIC")
      .attach("file", Buffer.from("public content"), "public.txt");

    expect(publicUpload.statusCode).toBe(201);
    const publicFileId = publicUpload.body.file.id;

    const res = await request(app).get(`/api/uploads/files/${publicFileId}/download`);
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/plain|application\/octet-stream/);

    await request(app)
      .delete(`/api/uploads/files/${publicFileId}`)
      .set("Authorization", `Bearer ${authToken}`);
  });

  test("List uploaded files", async () => {
    const res = await request(app)
      .get("/api/uploads/files")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.some((file) => file.id === uploadedFileId)).toBe(true);
  });

  test("Get uploaded file metadata", async () => {
    const res = await request(app)
      .get(`/api/uploads/files/${uploadedFileId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.file.id).toBe(uploadedFileId);
    expect(res.body.file.url).toBe(uploadedFileUrl);
  });

  test("Delete uploaded file", async () => {
    const res = await request(app)
      .delete(`/api/uploads/files/${uploadedFileId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const deleted = await prisma.file.findUnique({ where: { id: uploadedFileId } });
    expect(deleted).toBeNull();
    uploadedFileId = null;
  });
});
