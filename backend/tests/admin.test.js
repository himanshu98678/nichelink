const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

let adminToken;
let userToken;
let adminId;
let userId;
let reportId;
let postId;

beforeAll(async () => {
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Admin User',
    username: `admin${Date.now()}`,
    email: `admin${Date.now()}@example.com`,
    password: 'Password123!',
  });
  expect(adminRes.statusCode).toBe(201);
  adminToken = adminRes.body.token;
  adminId = adminRes.body.user.id;

  await prisma.user.update({
    where: { id: adminId },
    data: { role: 'ADMIN' },
  });

  const userRes = await request(app).post('/api/auth/register').send({
    name: 'Normal User',
    username: `user${Date.now()}`,
    email: `user${Date.now()}@example.com`,
    password: 'Password123!',
  });
  expect(userRes.statusCode).toBe(201);
  userToken = userRes.body.token;
  userId = userRes.body.user.id;

  const postRes = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      content: 'Admin post for reporting tests',
    });
  expect(postRes.statusCode).toBe(201);
  postId = postRes.body.post.id;
});

describe('Admin Panel and Reporting', () => {
  test('Admin dashboard is available only to admin users', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.dashboard).toHaveProperty('totals');
  });

  test('Non-admin cannot access admin dashboard', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('success', false);
  });

  test('Unauthenticated user cannot access admin dashboard', async () => {
    const res = await request(app).get('/api/admin/dashboard');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  test('Admin can filter and sort user list results', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ role: 'USER', q: 'Normal', sortBy: 'createdAt', sortOrder: 'desc' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.some((item) => item.id === userId)).toBe(true);
  });

  test('Admin can delete a managed post and user', async () => {
    const extraUserRes = await request(app).post('/api/auth/register').send({
      name: 'Deletable User',
      username: `deleteuser${Date.now()}`,
      email: `deleteuser${Date.now()}@example.com`,
      password: 'Password123!',
    });

    expect(extraUserRes.statusCode).toBe(201);
    const extraUserId = extraUserRes.body.user.id;

    const postRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ content: 'Admin content to delete' });

    expect(postRes.statusCode).toBe(201);
    const postToDeleteId = postRes.body.post.id;

    const deletePostRes = await request(app)
      .delete(`/api/admin/posts/${postToDeleteId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deletePostRes.statusCode).toBe(200);
    expect(deletePostRes.body).toHaveProperty('success', true);

    const deleteUserRes = await request(app)
      .delete(`/api/admin/users/${extraUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteUserRes.statusCode).toBe(200);
    expect(deleteUserRes.body).toHaveProperty('success', true);
  });

  test('User can submit a report against a post', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        targetType: 'POST',
        targetId: postId,
        reason: 'Inappropriate content',
        details: 'This post violates guidelines',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.report).toHaveProperty('id');
    expect(res.body.report).toHaveProperty('status', 'PENDING');
    reportId = res.body.report.id;
  });

  test('Reporter can list their own reports', async () => {
    const res = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.some((item) => item.id === reportId)).toBe(true);
  });

  test('Admin can list reports and resolve a report', async () => {
    const listRes = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body).toHaveProperty('success', true);
    expect(Array.isArray(listRes.body.items)).toBe(true);
    expect(listRes.body.items.some((item) => item.id === reportId)).toBe(true);

    const resolveRes = await request(app)
      .patch(`/api/admin/reports/${reportId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'RESOLVED',
        resolutionNotes: 'Report reviewed and resolved by admin',
      });

    expect(resolveRes.statusCode).toBe(200);
    expect(resolveRes.body).toHaveProperty('success', true);
    expect(resolveRes.body.report).toHaveProperty('status', 'RESOLVED');
    expect(resolveRes.body.report).toHaveProperty('resolvedById', adminId);
  });

  test('Admin can list users and fetch a user detail', async () => {
    const listUsersRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listUsersRes.statusCode).toBe(200);
    expect(listUsersRes.body).toHaveProperty('success', true);
    expect(Array.isArray(listUsersRes.body.items)).toBe(true);
    expect(listUsersRes.body.items.some((item) => item.id === adminId)).toBe(true);

    const userDetailRes = await request(app)
      .get(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(userDetailRes.statusCode).toBe(200);
    expect(userDetailRes.body).toHaveProperty('success', true);
    expect(userDetailRes.body.user).toHaveProperty('id', userId);
    expect(userDetailRes.body.user).toHaveProperty('email', expect.any(String));
  });
});
