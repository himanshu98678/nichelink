const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

let adminToken;
let userToken;
let adminId;
let userId;

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

  const updatedAdmin = await prisma.user.findUnique({ where: { id: adminId } });
  expect(updatedAdmin.role).toBe('ADMIN');

  const userRes = await request(app).post('/api/auth/register').send({
    name: 'Normal User',
    username: `user${Date.now()}`,
    email: `user${Date.now()}@example.com`,
    password: 'Password123!',
  });
  expect(userRes.statusCode).toBe(201);
  userToken = userRes.body.token;
  userId = userRes.body.user.id;
});

describe('Role Management', () => {
  test('Non-admin cannot assign roles', async () => {
    const res = await request(app)
      .post('/api/roles/assign')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ userId, role: 'ADMIN' });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('success', false);
  });

  test('Admin can assign USER role to another user', async () => {
    const res = await request(app)
      .post('/api/roles/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId, role: 'ADMIN' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.user).toHaveProperty('role', 'ADMIN');
  });

  test('Admin can fetch user roles', async () => {
    const res = await request(app)
      .get(`/api/roles/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.user).toHaveProperty('role');
  });
});
