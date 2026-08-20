const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

const buildUniqueValue = (prefix, maxLength = 18) => {
  const base = `${prefix}`.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const timestamp = Date.now().toString(36).slice(-4);
  const suffix = Math.random().toString(36).slice(2, 6);
  const available = Math.max(3, maxLength - timestamp.length - suffix.length);
  const trimmedBase = base.slice(0, available);
  return `${trimmedBase}${timestamp}${suffix}`.slice(0, maxLength);
};

let userToken;
let userId;
let communityId;
let inviteId;
const createdUserIds = [];

beforeAll(async () => {
  const unique = buildUniqueValue('community');
  const userRes = await request(app).post('/api/auth/register').send({
    name: 'Community User',
    username: unique,
    email: `${unique}@example.com`,
    password: 'Password123!',
  });
  expect(userRes.statusCode).toBe(201);
  userToken = userRes.body.token;
  userId = userRes.body.user.id;
  createdUserIds.push(userId);
});

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});

describe('Community System', () => {
  test('Create and retrieve community', async () => {
    const createRes = await request(app)
      .post('/api/communities')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Niche Community',
        description: 'A test community',
        visibility: 'public',
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.success).toBe(true);
    communityId = createRes.body.community.id;

    const getRes = await request(app)
      .get(`/api/communities/${communityId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.community).toHaveProperty('id', communityId);
    expect(getRes.body.community).toHaveProperty('name', 'Niche Community');
  });

  test('List communities includes created community', async () => {
    const listRes = await request(app)
      .get('/api/communities')
      .set('Authorization', `Bearer ${userToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body.communities)).toBe(true);
    expect(listRes.body.communities.some((c) => c.id === communityId)).toBe(true);
  });

  test('Create and list community post', async () => {
    const createPostRes = await request(app)
      .post(`/api/communities/${communityId}/posts`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Hello world', content: 'Community content' });

    expect(createPostRes.statusCode).toBe(201);
    expect(createPostRes.body.post).toHaveProperty('title', 'Hello world');

    const listPostRes = await request(app)
      .get(`/api/communities/${communityId}/posts`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(listPostRes.statusCode).toBe(200);
    expect(Array.isArray(listPostRes.body.posts)).toBe(true);
    expect(listPostRes.body.posts[0]).toHaveProperty('title', 'Hello world');
  });

  test('Invite a member and accept invite', async () => {
    const inviteeName = buildUniqueValue('invitee');
    const inviteeRes = await request(app).post('/api/auth/register').send({
      name: 'Invitee User',
      username: inviteeName,
      email: `${inviteeName}@example.com`,
      password: 'Password123!',
    });
    expect(inviteeRes.statusCode).toBe(201);
    createdUserIds.push(inviteeRes.body.user.id);
    const inviteeEmail = inviteeRes.body.user.email;
    const inviteeToken = inviteeRes.body.token;

    const inviteRes = await request(app)
      .post(`/api/communities/${communityId}/invite`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: inviteeEmail });

    expect(inviteRes.statusCode).toBe(200);
    inviteId = inviteRes.body.invite.id;

    const acceptRes = await request(app)
      .post(`/api/communities/invites/${inviteId}/accept`)
      .set('Authorization', `Bearer ${inviteeToken}`);

    expect(acceptRes.statusCode).toBe(200);
    expect(acceptRes.body.success).toBe(true);
  });

  test('Non-member cannot invite to community', async () => {
    const username = buildUniqueValue('outsider');
    const outsiderRes = await request(app).post('/api/auth/register').send({
      name: 'Outsider User',
      username,
      email: `${username}@example.com`,
      password: 'Password123!',
    });
    expect(outsiderRes.statusCode).toBe(201);
    createdUserIds.push(outsiderRes.body.user.id);
    const outsiderToken = outsiderRes.body.token;

    const inviteRes = await request(app)
      .post(`/api/communities/${communityId}/invite`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ email: `${buildUniqueValue('invite')}@example.com` });

    expect(inviteRes.statusCode).toBe(403);
    expect(inviteRes.body.success).toBe(false);
  });

  test('Private community blocks join without invite and restricts feed access', async () => {
    const privateRes = await request(app)
      .post('/api/communities')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Private Community',
        description: 'A private space',
        visibility: 'private',
      });
    expect(privateRes.statusCode).toBe(201);
    const privateCommunityId = privateRes.body.community.id;

    const joinRes = await request(app)
      .post(`/api/communities/${privateCommunityId}/join`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(joinRes.statusCode).toBe(200);

    const outsiderName = buildUniqueValue('privateoutsider');
    const outsiderRes = await request(app).post('/api/auth/register').send({
      name: 'Private Outsider',
      username: outsiderName,
      email: `${outsiderName}@example.com`,
      password: 'Password123!',
    });
    expect(outsiderRes.statusCode).toBe(201);
    createdUserIds.push(outsiderRes.body.user.id);
    const outsiderToken = outsiderRes.body.token;

    const badJoinRes = await request(app)
      .post(`/api/communities/${privateCommunityId}/join`)
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(badJoinRes.statusCode).toBe(403);
    expect(badJoinRes.body.success).toBe(false);

    const feedRes = await request(app)
      .get(`/api/communities/${privateCommunityId}/feed`)
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(feedRes.statusCode).toBe(403);
    expect(feedRes.body.success).toBe(false);
  });

  test('Only addressed user can accept a private community invite', async () => {
    const privateRes = await request(app)
      .post('/api/communities')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Private Invite Community',
        description: 'Invite only',
        visibility: 'private',
      });
    expect(privateRes.statusCode).toBe(201);
    const privateCommunityId = privateRes.body.community.id;

    const inviteeName = buildUniqueValue('addressed');
    const inviteeRes = await request(app).post('/api/auth/register').send({
      name: 'Addressed Invitee',
      username: inviteeName,
      email: `${inviteeName}@example.com`,
      password: 'Password123!',
    });
    expect(inviteeRes.statusCode).toBe(201);
    createdUserIds.push(inviteeRes.body.user.id);
    const inviteeEmail = inviteeRes.body.user.email;
    const inviteeToken = inviteeRes.body.token;

    const wrongName = buildUniqueValue('wronguser');
    const outsiderRes = await request(app).post('/api/auth/register').send({
      name: 'Wrong User',
      username: wrongName,
      email: `${wrongName}@example.com`,
      password: 'Password123!',
    });
    expect(outsiderRes.statusCode).toBe(201);
    createdUserIds.push(outsiderRes.body.user.id);
    const wrongToken = outsiderRes.body.token;

    const inviteRes = await request(app)
      .post(`/api/communities/${privateCommunityId}/invite`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: inviteeEmail });

    expect(inviteRes.statusCode).toBe(200);
    const privateInviteId = inviteRes.body.invite.id;

    const badAcceptRes = await request(app)
      .post(`/api/communities/invites/${privateInviteId}/accept`)
      .set('Authorization', `Bearer ${wrongToken}`);

    expect(badAcceptRes.statusCode).toBe(403);
    expect(badAcceptRes.body.success).toBe(false);

    const acceptRes = await request(app)
      .post(`/api/communities/invites/${privateInviteId}/accept`)
      .set('Authorization', `Bearer ${inviteeToken}`);

    expect(acceptRes.statusCode).toBe(200);
    expect(acceptRes.body.success).toBe(true);
  });

  test('Update, delete, and membership management enforce authorization', async () => {
    const communityRes = await request(app)
      .post('/api/communities')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Member Management Community', description: 'Test roles' });
    expect(communityRes.statusCode).toBe(201);
    const managedCommunityId = communityRes.body.community.id;

    const memberName = buildUniqueValue('member');
    const memberRes = await request(app).post('/api/auth/register').send({
      name: 'Member User',
      username: memberName,
      email: `${memberName}@example.com`,
      password: 'Password123!',
    });
    expect(memberRes.statusCode).toBe(201);
    createdUserIds.push(memberRes.body.user.id);
    const memberToken = memberRes.body.token;

    const inviteResponse = await request(app)
      .post(`/api/communities/${managedCommunityId}/invite`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: memberRes.body.user.email });
    expect(inviteResponse.statusCode).toBe(200);
    const memberInviteId = inviteResponse.body.invite.id;

    const acceptResponse = await request(app)
      .post(`/api/communities/invites/${memberInviteId}/accept`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(acceptResponse.statusCode).toBe(200);

    const ownerUpdateRes = await request(app)
      .put(`/api/communities/${managedCommunityId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Updated Community Name' });
    expect(ownerUpdateRes.statusCode).toBe(200);
    expect(ownerUpdateRes.body.community.name).toBe('Updated Community Name');

    const nonOwnerUpdateRes = await request(app)
      .put(`/api/communities/${managedCommunityId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Illegal Update' });
    expect(nonOwnerUpdateRes.statusCode).toBe(404);

    const modRoleRes = await request(app)
      .patch(`/api/communities/${managedCommunityId}/members/${memberRes.body.user.id}/role`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'MODERATOR' });
    expect(modRoleRes.statusCode).toBe(200);
    expect(modRoleRes.body.member.role).toBe('MODERATOR');

    const inviteByModeratorRes = await request(app)
      .post(`/api/communities/${managedCommunityId}/invite`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ email: `${buildUniqueValue('modinvite')}@example.com` });
    expect(inviteByModeratorRes.statusCode).toBe(200);

    const removeMemberRes = await request(app)
      .delete(`/api/communities/${managedCommunityId}/members/${memberRes.body.user.id}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(removeMemberRes.statusCode).toBe(200);

    const unauthorizedDeleteRes = await request(app)
      .delete(`/api/communities/${managedCommunityId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(unauthorizedDeleteRes.statusCode).toBe(404);
  });

  test('Reject invite and prevent duplicate invitations', async () => {
    const rejectionCommunityRes = await request(app)
      .post('/api/communities')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Rejection Community' });
    expect(rejectionCommunityRes.statusCode).toBe(201);
    const rejectionCommunityId = rejectionCommunityRes.body.community.id;

    const inviteeName = buildUniqueValue('rejection');
    const inviteeRes = await request(app).post('/api/auth/register').send({
      name: 'Reject User',
      username: inviteeName,
      email: `${inviteeName}@example.com`,
      password: 'Password123!',
    });
    expect(inviteeRes.statusCode).toBe(201);
    createdUserIds.push(inviteeRes.body.user.id);
    const inviteeToken = inviteeRes.body.token;

    const inviteRes1 = await request(app)
      .post(`/api/communities/${rejectionCommunityId}/invite`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: inviteeRes.body.user.email });
    expect(inviteRes1.statusCode).toBe(200);
    const inviteRes2 = await request(app)
      .post(`/api/communities/${rejectionCommunityId}/invite`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: inviteeRes.body.user.email });
    expect(inviteRes2.statusCode).toBe(400);

    const rejectRes = await request(app)
      .post(`/api/communities/invites/${inviteRes1.body.invite.id}/reject`)
      .set('Authorization', `Bearer ${inviteeToken}`);
    expect(rejectRes.statusCode).toBe(200);

    const rejectAgainRes = await request(app)
      .post(`/api/communities/invites/${inviteRes1.body.invite.id}/reject`)
      .set('Authorization', `Bearer ${inviteeToken}`);
    expect(rejectAgainRes.statusCode).toBe(400);
  });

  test('Invalid community or invite IDs return appropriate errors', async () => {
    const invalidCommunityRes = await request(app)
      .get('/api/communities/invalid-id')
      .set('Authorization', `Bearer ${userToken}`);
    expect(invalidCommunityRes.statusCode).toBe(404);

    const invalidInviteRes = await request(app)
      .post('/api/communities/invites/invalid-id/accept')
      .set('Authorization', `Bearer ${userToken}`);
    expect(invalidInviteRes.statusCode).toBe(404);
  });
});
