const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

jest.setTimeout(120000);

let authToken;
let userToken;
let userId;
let conversationId;
let communityId;
let projectId;
const uniqueSuffix = Date.now();

beforeAll(async () => {
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Search Admin',
    username: `searchadmin${Date.now()}`,
    email: `searchadmin${Date.now()}@example.com`,
    password: 'Password123!',
  });
  authToken = adminRes.body.token;
  userId = adminRes.body.user.id;

  await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });

  const userRes = await request(app).post('/api/auth/register').send({
    name: 'Search User',
    username: `searchuser${Date.now()}`,
    email: `searchuser${Date.now()}@example.com`,
    password: 'Password123!',
  });
  userToken = userRes.body.token;

  const communityRes = await request(app)
    .post('/api/communities')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      name: `Search Community ${uniqueSuffix}`,
      description: 'A community for search testing',
    });
  communityId = communityRes.body.community.id;

  const postRes = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      content: `Search post content #search @user ${uniqueSuffix}`,
      communityId,
    });
  postId = postRes.body.post.id;

  const jobRes = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      title: 'Search Engineer',
      company: 'SearchCorp',
      location: 'Remote',
      employmentType: 'Full-time',
      skills: ['search', 'node'],
      category: 'Engineering',
    });
  jobId = jobRes.body.job.id;

  const projectRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      title: 'Search Project',
      description: 'Search project description',
    });
  projectId = projectRes.body.project.id;

  const taskRes = await request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      title: 'Search Task',
      description: 'Search task description',
    });
  taskId = taskRes.body.task.id;

  const convRes = await request(app)
    .post('/api/conversations')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ targetUserId: userRes.body.user.id });
  conversationId = convRes.body.conversation.id;

  const messageRes = await request(app)
    .post('/api/messages')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      conversationId,
      content: 'Search message content',
    });
  messageId = messageRes.body.message.id;
});

afterAll(async () => {
  await prisma.searchHistory.deleteMany({});
  await prisma.searchKeyword.deleteMany({});
});

describe('Global Search', () => {
  test('GET /api/search returns grouped search results', async () => {
    const res = await request(app).get('/api/search').query({ q: 'search' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.type).toBe('all');
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  test('GET /api/search with type=posts returns only posts', async () => {
    const res = await request(app).get('/api/search').query({ q: 'search', type: 'posts' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.type).toBe('posts');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('GET /api/search with type=users returns only users', async () => {
    const res = await request(app).get('/api/search').query({ q: 'search', type: 'users' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.type).toBe('users');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.some((user) => user.username || user.name)).toBe(true);
  });

  test('GET /api/search with type=communities returns only communities', async () => {
    const res = await request(app).get('/api/search').query({ q: 'search', type: 'communities' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.type).toBe('communities');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.some((community) => community.name)).toBe(true);
  });

  test('GET /api/search with type=jobs returns only jobs', async () => {
    const res = await request(app).get('/api/search').query({ q: 'search', type: 'jobs' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.type).toBe('jobs');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.some((job) => job.title)).toBe(true);
  });

  test('GET /api/search with type=messages requires authentication', async () => {
    const res = await request(app).get('/api/search').query({ q: 'Search message', type: 'messages' });
    expect(res.statusCode).toBe(401);
  });

  test('Authenticated user can search messages in owned conversation', async () => {
    const res = await request(app)
      .get('/api/search')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ q: 'Search message', type: 'messages' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.type).toBe('messages');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items.some((message) => message.content || message.conversation)).toBe(true);
  });

  test('GET /api/search accepts case-insensitive type and sortBy values', async () => {
    const res = await request(app)
      .get('/api/search')
      .query({ q: 'search', type: 'JoBs', sortBy: 'Latest' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.type).toBe('jobs');
  });

  test('Non-member cannot search projects they do not belong to', async () => {
    const res = await request(app)
      .get('/api/search')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ q: 'Search Project', type: 'projects' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.type).toBe('projects');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(0);
  });

  test('Non-member cannot search tasks in a project they do not belong to', async () => {
    const res = await request(app)
      .get('/api/search')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ q: 'Search Task', type: 'tasks' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.type).toBe('tasks');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(0);
  });

  test('GET /api/search/recent returns recent searches for authenticated user', async () => {
    await request(app).get('/api/search').query({ q: 'search', type: 'users' }).set('Authorization', `Bearer ${authToken}`);
    const res = await request(app).get('/api/search/recent').set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.recent)).toBe(true);
  });

  test('DELETE /api/search/recent clears recent searches', async () => {
    const res = await request(app).delete('/api/search/recent').set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/search/trending returns keywords', async () => {
    const res = await request(app).get('/api/search/trending');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.trending)).toBe(true);
  });

  test('GET /api/search/suggestions returns suggested keywords', async () => {
    const res = await request(app).get('/api/search/suggestions').query({ q: 'search' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.suggestions.recent)).toBe(true);
    expect(Array.isArray(res.body.suggestions.popular)).toBe(true);
    expect(Array.isArray(res.body.suggestions.matching)).toBe(true);
  });
});
