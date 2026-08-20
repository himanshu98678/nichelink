const request = require('supertest');
const app = require('../src/app');

describe('Project management system', () => {
  let ownerToken;
  let memberToken;
  let ownerId;
  let memberId;
  let projectId;
  let memberRecordId;
  let taskId;

  beforeAll(async () => {
    const ownerSuffix = Date.now().toString().slice(-6);
    const ownerRes = await request(app).post('/api/auth/register').send({
      name: `ProjectOwner ${ownerSuffix}`,
      username: `owner${ownerSuffix}`,
      email: `projectowner${ownerSuffix}@example.com`,
      password: 'Password123!',
    });
    expect(ownerRes.statusCode).toBe(201);
    ownerToken = ownerRes.body.token;
    ownerId = ownerRes.body.user.id;

    const memberSuffix = (Date.now() + 1).toString().slice(-6);
    const memberRes = await request(app).post('/api/auth/register').send({
      name: `ProjectMember ${memberSuffix}`,
      username: `member${memberSuffix}`,
      email: `projectmember${memberSuffix}@example.com`,
      password: 'Password123!',
    });
    expect(memberRes.statusCode).toBe(201);
    memberToken = memberRes.body.token;
    memberId = memberRes.body.user.id;
  });

  test('Owner can create a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Project Management Test',
        description: 'A sample project for project management tests',
        status: 'active',
        priority: 'high',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.project).toHaveProperty('id');
    expect(res.body.project.title).toBe('Project Management Test');
    projectId = res.body.project.id;
  });

  test('Owner can list project members and add a member as MANAGER', async () => {
    const assignRes = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: memberId, role: 'manager' });

    expect(assignRes.statusCode).toBe(200);
    expect(assignRes.body.success).toBe(true);
    expect(assignRes.body.member.role).toBe('MANAGER');
    memberRecordId = assignRes.body.member.id;

    const membersRes = await request(app)
      .get(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(membersRes.statusCode).toBe(200);
    expect(membersRes.body.success).toBe(true);
    expect(Array.isArray(membersRes.body.members)).toBe(true);
    expect(membersRes.body.members.some((m) => m.user.id === memberId)).toBe(true);
  });

  test('Owner can update a member role to MEMBER', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}/members/${memberRecordId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'member' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.member.role).toBe('MEMBER');
  });

  test('Member can access project dashboard and project details', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.project.id).toBe(projectId);

    const dashboardRes = await request(app)
      .get(`/api/projects/${projectId}/dashboard`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(dashboardRes.statusCode).toBe(200);
    expect(dashboardRes.body.success).toBe(true);
    expect(dashboardRes.body.dashboard).toHaveProperty('project');
    expect(dashboardRes.body.dashboard).toHaveProperty('stats');
  });

  test('Member cannot assign another user to the project', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ userId: ownerId, role: 'member' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('Member can create, update, and delete a task', async () => {
    const createRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Assigned Task',
        description: 'Task created by member',
        priority: 'urgent',
        status: 'in-progress',
        assigneeId: memberId,
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.task.assignedTo).toBe(memberId);
    taskId = createRes.body.task.id;

    const updateRes = await request(app)
      .put(`/api/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'done', priority: 'medium' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.task.status).toBe('DONE');

    const deleteRes = await request(app)
      .delete(`/api/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  test('Owner can remove a member and revoke access', async () => {
    const removeRes = await request(app)
      .delete(`/api/projects/${projectId}/members/${memberRecordId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(removeRes.statusCode).toBe(200);
    expect(removeRes.body.success).toBe(true);

    const memberAccessRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(memberAccessRes.statusCode).toBe(404);
    expect(memberAccessRes.body.success).toBe(false);
  });
});
