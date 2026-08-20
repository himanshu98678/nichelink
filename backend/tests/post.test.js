const request = require('supertest');
const app = require('../src/app');

jest.setTimeout(60000);

let authToken;
let otherToken;
let postId;
let commentId;

const userData = {
  name: 'Post Tester',
  username: `posttester_${Date.now()}`,
  email: `posttester_${Date.now()}@example.com`,
  password: 'Password123!',
};

const otherUser = {
  name: 'Other User',
  username: `other_${Date.now()}`,
  email: `other_${Date.now()}@example.com`,
  password: 'Password123!',
};

describe('Posts system integration', () => {
  test('Register primary user', async () => {
    const res = await request(app).post('/api/auth/register').send(userData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    authToken = res.body.token;
  });

  test('Register other user', async () => {
    const res = await request(app).post('/api/auth/register').send(otherUser);
    expect(res.statusCode).toBe(201);
    otherToken = res.body.token;
  });

  test('Create post', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Hello world from test' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.post).toHaveProperty('id');
    postId = res.body.post.id;
  });

  test('Edit own post', async () => {
    const res = await request(app)
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Edited content' });

    expect(res.statusCode).toBe(200);
    expect(res.body.post.content).toBe('Edited content');
  });

  test('Like and Unlike post', async () => {
    const likeRes = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();
    expect(likeRes.statusCode).toBe(200);
    expect(likeRes.body.liked).toBe(true);

    const unlikeRes = await request(app)
      .delete(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();
    expect(unlikeRes.statusCode).toBe(200);
    expect(unlikeRes.body.liked).toBe(false);
  });

  test('Save and Unsave post', async () => {
    const saveRes = await request(app)
      .post(`/api/posts/${postId}/save`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();
    expect(saveRes.statusCode).toBe(200);
    expect(saveRes.body.saved).toBe(true);

    const unsaveRes = await request(app)
      .delete(`/api/posts/${postId}/save`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();
    expect(unsaveRes.statusCode).toBe(200);
    expect(unsaveRes.body.saved).toBe(false);
  });

  test('List saved posts', async () => {
    // save again
    await request(app)
      .post(`/api/posts/${postId}/save`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    const res = await request(app)
      .get('/api/posts/saved?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);
    expect(res.body.posts.some(p => p.id === postId)).toBe(true);
  });

  test('Share post and validate share count', async () => {
    const shareRes = await request(app)
      .post(`/api/posts/${postId}/share`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ message: 'Nice post' });
    expect(shareRes.statusCode).toBe(201);

    const getRes = await request(app)
      .get(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.post).toHaveProperty('shareCount');
    expect(getRes.body.post.shareCount).toBeGreaterThanOrEqual(1);
  });

  test('Create comment and reply', async () => {
    const cRes = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Top-level comment' });
    expect(cRes.statusCode).toBe(201);
    expect(cRes.body.comment).toHaveProperty('id');
    commentId = cRes.body.comment.id;

    const rRes = await request(app)
      .post(`/api/comments/${commentId}/reply`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Reply to comment' });
    expect(rRes.statusCode).toBe(201);
    expect(rRes.body.reply).toHaveProperty('id');
  });

  test('Unauthorized edit attempt', async () => {
    const res = await request(app)
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'I should not be allowed' });
    expect(res.statusCode).toBe(403);
  });

  test('Unauthorized delete attempt', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send();
    expect(res.statusCode).toBe(403);
  });

  test('Pagination and listing', async () => {
    // create several posts
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: `Bulk post ${i}` });
    }

    const res = await request(app)
      .get('/api/posts?page=1&limit=2')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBeLessThanOrEqual(2);
  });

  test('Get single post', async () => {
    const res = await request(app)
      .get(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(res.statusCode).toBe(200);
    expect(res.body.post).toHaveProperty('id', postId);
  });

  test('Delete own post', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();
    expect(res.statusCode).toBe(200);
  });
});
