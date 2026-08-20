const request = require("supertest");
const crypto = require("crypto");

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    verify: jest.fn().mockResolvedValue(true),
    sendMail: jest.fn(async ({ to }) => ({
      messageId: "test-message-id",
      accepted: [to],
      rejected: [],
      response: "250 OK",
    })),
  })),
}));

process.env.SMTP_HOST = "smtp.test.invalid";
process.env.OTP_RESEND_COOLDOWN_SECONDS = "0";

const app = require("../src/app");
const emailService = require("../src/services/emailService");

jest.setTimeout(30000);

const userData = {
  name: "Email Tester",
  username: `emailtest${Date.now() % 10000}`,
  email: `emailtester_${Date.now()}@example.com`,
  password: "Password123!",
};

describe("Email communication system", () => {
  let authToken;
  let userId;
  let otpRandom;

  beforeAll(() => {
    otpRandom = jest.spyOn(crypto, "randomInt").mockReturnValue(292334);
  });

  afterAll(() => {
    otpRandom.mockRestore();
  });

  test("registers a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(userData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("token");
    authToken = res.body.token;
    userId = res.body.user.id;
  });

  test("returns default email preferences", async () => {
    const res = await request(app)
      .get("/api/email/preferences")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.preferences).toMatchObject({
      marketing: true,
      notifications: true,
      productUpdates: true,
      securityAlerts: true,
    });
  });

  test("updates email preferences successfully", async () => {
    const res = await request(app)
      .put("/api/email/preferences")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ preferences: { marketing: false, notifications: true } });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.preferences).toMatchObject({
      marketing: false,
      notifications: true,
      productUpdates: true,
      securityAlerts: true,
    });
  });

  test("sends and verifies email OTP codes via service", async () => {
    const result = await emailService.sendOtpCodeToUser({ email: userData.email, type: "LOGIN" });
    expect(result).toHaveProperty("message", "OTP email sent");

    const verifyResult = await emailService.verifyOtpCode({
      email: userData.email,
      code: "292334",
      type: "LOGIN",
    });

    expect(verifyResult).toEqual({ success: true, userId });
  });

  test("invalidates the previous OTP when resending", async () => {
    otpRandom.mockReturnValueOnce(483921).mockReturnValueOnce(847291);

    await emailService.sendOtpCodeToUser({ email: userData.email, type: "VERIFY" });
    await emailService.sendOtpCodeToUser({ email: userData.email, type: "VERIFY" });

    await expect(
      emailService.verifyOtpCode({ email: userData.email, code: "483921", type: "VERIFY" })
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      emailService.verifyOtpCode({ email: userData.email, code: "847291", type: "VERIFY" })
    ).resolves.toEqual({ success: true, userId });
  });
});
