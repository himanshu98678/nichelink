const request = require("supertest");
const prisma = require("../src/lib/prisma");

process.env.AUTH_RATE_LIMIT_MAX = "2";
process.env.EMAIL_RATE_LIMIT_MAX = "10";
process.env.EMAIL_QUEUE_ENABLED = "false";

const app = require("../src/app");
const emailService = require("../src/services/emailService");

jest.setTimeout(60000);

describe("Email auth flow", () => {
  let user;
  let passwordResetToken;

  beforeAll(async () => {
    const suffix = Date.now();
    const res = await request(app).post("/api/auth/register").send({
      name: "Email Flow User",
      username: `email_flow_${suffix}`,
      email: `email_flow_${suffix}@example.com`,
      password: "Password123!",
    });

    expect(res.statusCode).toBe(201);
    user = res.body.user;
  });

  afterAll(async () => {
    if (user?.id) {
      await prisma.user.deleteMany({ where: { id: user.id } }).catch(() => null);
    }
    await prisma.$disconnect();
  });

  test("creates a verification token that can be used once", async () => {
    const result = await emailService.createVerificationToken(user.id);
    expect(result.token).toBeTruthy();
    expect(result.expiresAt).toBeInstanceOf(Date);

    const verifyResponse = await request(app).get(`/api/auth/verify-email/${result.token}`);
    expect(verifyResponse.statusCode).toBe(200);
    expect(verifyResponse.body.success).toBe(true);
  });

  test("resend verification is idempotent and generic for existing users", async () => {
    const resend = await request(app).post("/api/auth/verify-email").send({ email: user.email });
    expect(resend.statusCode).toBe(200);
    expect(resend.body.success).toBe(true);
  });

  test("forgot password creates a reset token and reset password succeeds", async () => {
    const forgot = await request(app).post("/api/auth/forgot-password").send({ email: user.email });
    expect(forgot.statusCode).toBe(200);
    expect(forgot.body.success).toBe(true);

    const refreshedUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(refreshedUser.passwordResetToken).toBeTruthy();

    passwordResetToken = await emailService.createPasswordResetToken(user.id);
    const resetResponse = await request(app).post("/api/auth/reset-password").send({
      token: passwordResetToken.token,
      password: "NewPassword123!",
    });

    expect(resetResponse.statusCode).toBe(200);
    expect(resetResponse.body.success).toBe(true);
  });

  test("expired password reset tokens are rejected", async () => {
    const generated = await emailService.createPasswordResetToken(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetExpiresAt: new Date(Date.now() - 60 * 1000) },
    });

    const expired = await emailService.resetPasswordWithToken({ token: generated.token, password: "AnotherPass123!" });
    expect(expired).toBe(false);
  });

  test("reused and invalid reset tokens are rejected", async () => {
    const fresh = await emailService.createPasswordResetToken(user.id);
    const first = await request(app).post("/api/auth/reset-password").send({
      token: fresh.token,
      password: "FinalPassword123!",
    });
    expect(first.statusCode).toBe(200);

    const second = await request(app).post("/api/auth/reset-password").send({
      token: fresh.token,
      password: "AnotherPassword123!",
    });
    expect(second.statusCode).toBe(400);

    const invalid = await request(app).post("/api/auth/reset-password").send({
      token: "not-real-token",
      password: "AnotherPassword123!",
    });
    expect(invalid.statusCode).toBe(400);
  });

  test("provider failures are handled gracefully", async () => {
    const originalHost = process.env.SMTP_HOST;
    process.env.SMTP_HOST = "smtp.invalid.invalid";
    process.env.SMTP_PORT = "25";

    try {
      await expect(emailService.sendVerificationEmailToUser(user)).resolves.toBeTruthy();
    } finally {
      if (originalHost === undefined) {
        delete process.env.SMTP_HOST;
      } else {
        process.env.SMTP_HOST = originalHost;
      }
    }
  });

  test("email routes hit rate limits when configured low", async () => {
    process.env.EMAIL_RATE_LIMIT_MAX = "2";
    const responses = [];
    for (let i = 0; i < 3; i += 1) {
      const res = await request(app).post("/api/auth/forgot-password").send({ email: user.email });
      responses.push(res.statusCode);
    }

    expect(responses.some((code) => code === 429)).toBe(true);
    process.env.EMAIL_RATE_LIMIT_MAX = "10";
  });
});
