const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const emailService = require('../src/services/emailService');
const { createRefreshToken } = require('../src/services/authService');

jest.setTimeout(30000);

describe('Email verification and password reset flows', () => {
  let userData;
  let userId;

  beforeAll(() => {
    const ts = Date.now();
    userData = {
      name: 'VerifyReset Tester',
      username: `vr_test_${ts}`,
      email: `vr_test_${ts}@example.com`,
      password: 'Password123!',
    };
  });

  test('Register and verify email via token', async () => {
    const res = await request(app).post('/api/auth/register').send(userData);
    expect(res.statusCode).toBe(201);
    userId = res.body.user.id;

    const { token } = await emailService.createVerificationToken(userId);
    const verifyRes = await request(app).get(`/api/auth/verify-email/${token}`);
    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body).toHaveProperty('success', true);

    const u = await prisma.user.findUnique({ where: { id: userId } });
    expect(u.isVerified).toBe(true);
  });

  test('Password reset revokes all refresh tokens', async () => {
    // login to create a refresh token
    const loginRes = await request(app).post('/api/auth/login').send({
      email: userData.email,
      password: userData.password,
    });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('refreshToken');
    authToken = loginRes.body.token;

    // create an extra refresh token (simulate another device)
    await createRefreshToken(userId, undefined, { ip: '127.0.0.1', userAgent: 'test-agent' });

    // ensure there are refresh tokens
    let tokens = await prisma.refreshToken.findMany({ where: { userId } });
    expect(tokens.length).toBeGreaterThanOrEqual(1);

    // create reset token and call reset endpoint
    const { token } = await emailService.createPasswordResetToken(userId);
    const resetRes = await request(app).post('/api/auth/reset-password').send({ token, password: 'NewPassword123!' });
    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.body).toHaveProperty('success', true);

    // refresh tokens should be revoked
    tokens = await prisma.refreshToken.findMany({ where: { userId } });
    expect(tokens.every((t) => t.revoked === true)).toBe(true);
  });
});
