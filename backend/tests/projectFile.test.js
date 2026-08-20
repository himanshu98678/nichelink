const request = require('supertest');
const app = require('../src/app');

jest.setTimeout(30000);

describe('Project file management', () => {
  let authToken;
  let projectId;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Project File User',
      username: `projectfile${Date.now()}`,
      email: `projectfile${Date.now()}@example.com`,
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    authToken = res.body.token;

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Project Files Test' });

    expect(projectRes.statusCode).toBe(201);
    expect(projectRes.body).toHaveProperty('success', true);
    projectId = projectRes.body.project.id;
  });

  test('Upload a file to a project', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/files`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', Buffer.from('Hello World'), 'hello.txt');

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.projectFile).toHaveProperty('id');
    expect(res.body.projectFile).toHaveProperty('url');
    expect(res.body.projectFile.fileName).toBe('hello.txt');
  });

  test('List project files', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/files`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.files)).toBe(true);
    expect(res.body.files.length).toBeGreaterThanOrEqual(1);
  });

  test('Get and delete a project file', async () => {
    const listRes = await request(app)
      .get(`/api/projects/${projectId}/files`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.files.length).toBeGreaterThan(0);

    const fileId = listRes.body.files[0].id;

    const getRes = await request(app)
      .get(`/api/projects/${projectId}/files/${fileId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.file.id).toBe(fileId);

    const deleteRes = await request(app)
      .delete(`/api/projects/${projectId}/files/${fileId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
