const request = require('supertest');
const app = require('../src/app');

describe('NicheLink Backend basic routes', () => {
  test('GET / should respond with status 200 and JSON', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('POST /api/auth/register with missing fields should return 400', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('errors');
  });

  test('POST /api/auth/login with missing fields should return 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('errors');
  });

  test('POST /api/auth/forgot-password with missing email should return 400', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('errors');
  });
});