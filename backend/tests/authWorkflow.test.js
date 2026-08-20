const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.setTimeout(30000);

let authToken;
let refreshToken;
let projectId;
let taskId;

const makeUserData = (prefix = 'testuser') => {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    name: 'Test User',
    username: `${prefix}${suffix}`.slice(0, 24),
    email: `${prefix}${suffix}@example.com`,
    password: 'Password123!',
  };
};

const userData = makeUserData('testuser');

describe('Authentication edge cases', () => {
  test('Duplicate registration is rejected without exposing password data', async () => {
    const firstRegistration = await request(app).post('/api/auth/register').send(userData);
    expect(firstRegistration.statusCode).toBe(201);

    const duplicate = await request(app).post('/api/auth/register').send(userData);
    expect(duplicate.statusCode).toBe(400);
    expect(duplicate.body).toHaveProperty('success', false);
    expect(duplicate.body).not.toHaveProperty('password');
  });

  test('Invalid email and weak password are rejected', async () => {
    const invalidEmail = await request(app).post('/api/auth/register').send({
      name: 'Bad Input',
      username: `badinput${Date.now()}`,
      email: 'not-an-email',
      password: 'Password123!',
    });
    expect(invalidEmail.statusCode).toBe(400);

    const weakPassword = await request(app).post('/api/auth/register').send({
      name: 'Bad Input',
      username: `weakpw${Date.now()}`,
      email: `weakpw${Date.now()}@example.com`,
      password: 'weakpass',
    });
    expect(weakPassword.statusCode).toBe(400);
  });

  test('Wrong password and nonexistent account are rejected safely', async () => {
    const badPassword = await request(app).post('/api/auth/login').send({
      email: userData.email,
      password: 'WrongPassword123!',
    });
    expect(badPassword.statusCode).toBe(401);
    expect(badPassword.body).toHaveProperty('success', false);

    const missingUser = await request(app).post('/api/auth/login').send({
      email: 'missing-user@example.com',
      password: 'Password123!',
    });
    expect(missingUser.statusCode).toBe(401);
    expect(missingUser.body).toHaveProperty('success', false);
  });

  test('Expired and malformed tokens are rejected', async () => {
    const expired = jwt.sign({ id: 'expired-user-id' }, process.env.JWT_SECRET, { expiresIn: -1 });
    const expiredRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(expiredRes.statusCode).toBe(401);

    const malformed = await request(app).get('/api/auth/me').set('Authorization', 'Bearer bad-token');
    expect(malformed.statusCode).toBe(401);

    const missing = await request(app).get('/api/auth/me');
    expect(missing.statusCode).toBe(401);
  });
});

describe('Authenticated workflow', () => {
  test('Register new user successfully', async () => {
    const freshUser = makeUserData('authfresh');
    const res = await request(app).post('/api/auth/register').send(freshUser);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).not.toHaveProperty('password');
    authToken = res.body.token;
    refreshToken = res.body.refreshToken;

    userData.email = freshUser.email;
    userData.username = freshUser.username;
    userData.password = freshUser.password;
  });

  test('Login with registered user successfully', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: userData.email,
      password: userData.password,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    authToken = res.body.token;
    refreshToken = res.body.refreshToken;
  });

  test('Refresh token issues a new access token and refresh token', async () => {
    const oldRefreshToken = refreshToken;
    const res = await request(app).post('/api/auth/refresh-token').send({ token: oldRefreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.refreshToken).not.toBe(oldRefreshToken);

    authToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  test('Old refresh token cannot be reused after rotation', async () => {
    const oldRefreshToken = refreshToken;
    const res = await request(app).post('/api/auth/refresh-token').send({ token: oldRefreshToken });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('refreshToken');

    const revokedRes = await request(app).post('/api/auth/refresh-token').send({ token: oldRefreshToken });
    expect(revokedRes.statusCode).toBe(401);
    expect(revokedRes.body).toHaveProperty('success', false);

    authToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  test('Authenticated user can list sessions', async () => {
    const res = await request(app).get('/api/auth/sessions').set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.length).toBeGreaterThan(0);
  });

  test('Logout revokes the current refresh token', async () => {
    const res = await request(app).post('/api/auth/logout').send({ token: refreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('Refresh using a logged-out token fails', async () => {
    const res = await request(app).post('/api/auth/refresh-token').send({ token: refreshToken });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  test('Logout all revokes all sessions', async () => {
    const res = await request(app).post('/api/auth/logout-all').set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('Sessions after logout-all are revoked', async () => {
    const res = await request(app).get('/api/auth/sessions').set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.every((session) => session.revoked === true)).toBe(true);
  });

  test('Create project successfully', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Project',
        description: 'A sample project for authenticated tests',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.project).toHaveProperty('id');
    projectId = res.body.project.id;
  });

  test('Create task within project successfully', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Task',
        description: 'A task created in tests',
        priority: 'medium',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.task).toHaveProperty('id');
    taskId = res.body.task.id;
  });

  test('Create subtask successfully', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks/${taskId}/subtasks`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Subtask',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.subtask).toHaveProperty('id');
  });

  test('Create comment successfully', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'This is a test comment',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.comment).toHaveProperty('id');
  });

  test('Create time entry successfully', async () => {
    const now = new Date();
    const later = new Date(now.getTime() + 1000 * 60 * 30);
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks/${taskId}/time-entries`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        startedAt: now.toISOString(),
        endedAt: later.toISOString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.entry).toHaveProperty('id');
    expect(res.body.entry).toHaveProperty('durationMinutes');
  });
});
