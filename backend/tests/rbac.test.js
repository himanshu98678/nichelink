const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

jest.setTimeout(30000);

describe('RBAC and role assignment', () => {
  let normal, target, admin, superAdmin;
  let normalToken, adminToken, superToken;

  beforeAll(async () => {
    const ts = Date.now();
    // create users
    const base = { password: 'Password123!' };
    const resA = await request(app).post('/api/auth/register').send({ name: 'Normal', username: `norm${ts}`, email: `norm${ts}@example.com`, ...base });
    normal = resA.body.user;

    const resT = await request(app).post('/api/auth/register').send({ name: 'Target', username: `tgt${ts}`, email: `tgt${ts}@example.com`, ...base });
    target = resT.body.user;

    const resB = await request(app).post('/api/auth/register').send({ name: 'AdminUser', username: `adm${ts}`, email: `adm${ts}@example.com`, ...base });
    admin = resB.body.user;

    const resC = await request(app).post('/api/auth/register').send({ name: 'SuperUser', username: `sup${ts}`, email: `sup${ts}@example.com`, ...base });
    superAdmin = resC.body.user;

    // login normal user
    const l1 = await request(app).post('/api/auth/login').send({ email: normal.email, password: base.password });
    normalToken = l1.body.token;

    // promote admin user to ADMIN directly in DB
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } });
    const l2 = await request(app).post('/api/auth/login').send({ email: admin.email, password: base.password });
    adminToken = l2.body.token;

    // promote superAdmin to SUPER_ADMIN in DB
    await prisma.user.update({ where: { id: superAdmin.id }, data: { role: 'SUPER_ADMIN' } });
    const l3 = await request(app).post('/api/auth/login').send({ email: superAdmin.email, password: base.password });
    superToken = l3.body.token;
  });

  test('Unauthenticated cannot assign roles (401)', async () => {
    const res = await request(app).post('/api/roles/assign').send({ userId: target.id, role: 'ADMIN' });
    expect(res.statusCode).toBe(401);
  });

  test('Normal user cannot assign roles (403)', async () => {
    const res = await request(app).post('/api/roles/assign').set('Authorization', `Bearer ${normalToken}`).send({ userId: target.id, role: 'ADMIN' });
    expect(res.statusCode).toBe(403);
  });

  test('ADMIN can assign ADMIN but cannot assign SUPER_ADMIN', async () => {
    const ok = await request(app).post('/api/roles/assign').set('Authorization', `Bearer ${adminToken}`).send({ userId: target.id, role: 'ADMIN' });
    expect(ok.statusCode).toBe(200);

    const fail = await request(app).post('/api/roles/assign').set('Authorization', `Bearer ${adminToken}`).send({ userId: target.id, role: 'SUPER_ADMIN' });
    expect(fail.statusCode).toBe(403);
  });

  test('SUPER_ADMIN can assign SUPER_ADMIN', async () => {
    const res = await request(app).post('/api/roles/assign').set('Authorization', `Bearer ${superToken}`).send({ userId: target.id, role: 'SUPER_ADMIN' });
    expect(res.statusCode).toBe(200);
  });
});
