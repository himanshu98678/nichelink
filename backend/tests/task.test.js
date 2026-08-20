const request = require('supertest');
const app = require('../src/app');

describe('NicheLink Backend task endpoints', () => {
  test('GET /api/projects/:projectId/tasks without auth should return 401', async () => {
    const res = await request(app).get('/api/projects/test-project/tasks');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  test('POST /api/projects/:projectId/tasks without auth should return 401', async () => {
    const res = await request(app).post('/api/projects/test-project/tasks').send({
      title: 'Test task',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  test('GET /api/projects/:projectId/tasks/:taskId without auth should return 401', async () => {
    const res = await request(app).get('/api/projects/test-project/tasks/test-task');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  test('POST /api/projects/:projectId/tasks/:taskId/comments without auth should return 401', async () => {
    const res = await request(app).post('/api/projects/test-project/tasks/test-task/comments').send({
      content: 'Hello',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  test('POST /api/projects/:projectId/tasks/:taskId/subtasks without auth should return 401', async () => {
    const res = await request(app).post('/api/projects/test-project/tasks/test-task/subtasks').send({
      title: 'Subtask',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  test('POST /api/projects/:projectId/tasks/:taskId/time-entries without auth should return 401', async () => {
    const res = await request(app).post('/api/projects/test-project/tasks/test-task/time-entries').send({
      startedAt: new Date().toISOString(),
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });
});
