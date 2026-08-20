const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

jest.setTimeout(60000);

let userAToken, userBToken, userCToken;
let userAId, userBId, userCId;
let pubCommunityId, privCommunityId;
let post1Id, post2Id, post3Id, post4Id, post5Id, post6Id, post7Id;

beforeAll(async () => {
  const ts = Date.now();

  // Create User A
  const resA = await request(app).post("/api/auth/register").send({
    name: "User A",
    username: `usera_${ts}`,
    email: `usera_${ts}@example.com`,
    password: "Password123!",
  });
  userAToken = resA.body.token;
  userAId = resA.body.user.id;

  // Create User B
  const resB = await request(app).post("/api/auth/register").send({
    name: "User B",
    username: `userb_${ts}`,
    email: `userb_${ts}@example.com`,
    password: "Password123!",
  });
  userBToken = resB.body.token;
  userBId = resB.body.user.id;

  // Create User C
  const resC = await request(app).post("/api/auth/register").send({
    name: "User C",
    username: `userc_${ts}`,
    email: `userc_${ts}@example.com`,
    password: "Password123!",
  });
  userCToken = resC.body.token;
  userCId = resC.body.user.id;

  // User A follows User B
  await prisma.userFollow.create({
    data: {
      followerId: userAId,
      followingId: userBId,
    },
  });

  // Create Public Community owned by B
  const pubComm = await prisma.community.create({
    data: {
      name: `Public Comm ${ts}`,
      slug: `pub-comm-${ts}`,
      visibility: "public",
      ownerId: userBId,
    },
  });
  pubCommunityId = pubComm.id;

  // User A joins Public Community
  await prisma.communityMember.create({
    data: {
      communityId: pubCommunityId,
      userId: userAId,
      role: "MEMBER",
    },
  });

  // Create Private Community owned by B
  const privComm = await prisma.community.create({
    data: {
      name: `Private Comm ${ts}`,
      slug: `priv-comm-${ts}`,
      visibility: "private",
      ownerId: userBId,
    },
  });
  privCommunityId = privComm.id;

  // Create Posts
  // Post 1: By B, PUBLIC
  const p1 = await prisma.post.create({
    data: { authorId: userBId, content: "Public post by B about tech", visibility: "PUBLIC" },
  });
  post1Id = p1.id;

  // Post 2: By B, FOLLOWERS
  const p2 = await prisma.post.create({
    data: { authorId: userBId, content: "Followers only post by B", visibility: "FOLLOWERS" },
  });
  post2Id = p2.id;

  // Post 3: By B, PRIVATE
  const p3 = await prisma.post.create({
    data: { authorId: userBId, content: "Private post by B", visibility: "PRIVATE" },
  });
  post3Id = p3.id;

  // Post 4: By C, PUBLIC
  const p4 = await prisma.post.create({
    data: { authorId: userCId, content: "Public post by C about gaming", visibility: "PUBLIC" },
  });
  post4Id = p4.id;

  // Post 5: By B in Public Community
  const p5 = await prisma.post.create({
    data: { authorId: userBId, communityId: pubCommunityId, content: "Public community post in pubCommunity", visibility: "PUBLIC" },
  });
  post5Id = p5.id;

  // Post 6: By B in Private Community
  const p6 = await prisma.post.create({
    data: { authorId: userBId, communityId: privCommunityId, content: "Private community post in privCommunity", visibility: "PUBLIC" },
  });
  post6Id = p6.id;

  // Post 7: By A, PUBLIC
  const p7 = await prisma.post.create({
    data: { authorId: userAId, content: "Public post by A", visibility: "PUBLIC" },
  });
  post7Id = p7.id;

  // User A likes Post 1 and saves Post 1
  await prisma.postLike.create({ data: { userId: userAId, postId: post1Id } });
  await prisma.postSave.create({ data: { userId: userAId, postId: post1Id } });
});

afterAll(async () => {
  const postIds = [post1Id, post2Id, post3Id, post4Id, post5Id, post6Id, post7Id].filter(Boolean);
  await prisma.postLike.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.postSave.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.post.deleteMany({ where: { id: { in: postIds } } });
  await prisma.communityMember.deleteMany({ where: { communityId: { in: [pubCommunityId, privCommunityId].filter(Boolean) } } });
  await prisma.community.deleteMany({ where: { id: { in: [pubCommunityId, privCommunityId].filter(Boolean) } } });
  await prisma.userFollow.deleteMany({ where: { OR: [{ followerId: userAId }, { followerId: userBId }, { followerId: userCId }] } });
  await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId, userCId].filter(Boolean) } } });
  await prisma.$disconnect();
});

describe("Social Feed System API", () => {
  test("1. Home Feed for authenticated user (User A)", async () => {
    const res = await request(app)
      .get("/api/feed")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);

    const ids = res.body.items.map((item) => item.id);
    expect(ids).toContain(post1Id); // B public
    expect(ids).toContain(post2Id); // B followers (A follows B)
    expect(ids).toContain(post4Id); // C public
    expect(ids).toContain(post5Id); // B in pubComm
    expect(ids).toContain(post7Id); // A public
    expect(ids).not.toContain(post3Id); // B private
    expect(ids).not.toContain(post6Id); // B in privComm (A not member)

    // Verify response structure format
    const item1 = res.body.items.find((i) => i.id === post1Id);
    expect(item1).toHaveProperty("author");
    expect(item1).toHaveProperty("avatar");
    expect(item1).toHaveProperty("username");
    expect(item1).toHaveProperty("community");
    expect(item1).toHaveProperty("createdAt");
    expect(item1).toHaveProperty("editedAt");
    expect(item1).toHaveProperty("content");
    expect(item1).toHaveProperty("images");
    expect(item1).toHaveProperty("visibility");
    expect(item1).toHaveProperty("likeCount");
    expect(item1).toHaveProperty("commentCount");
    expect(item1).toHaveProperty("shareCount");
    expect(item1).toHaveProperty("saveCount");
    expect(item1).toHaveProperty("isLiked", true);
    expect(item1).toHaveProperty("isSaved", true);
    expect(item1).toHaveProperty("isFollowingAuthor", true);
  });

  test("2. Latest Feed returns all public posts", async () => {
    const res = await request(app)
      .get("/api/feed/latest")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const ids = res.body.items.map((item) => item.id);
    expect(ids).toContain(post1Id);
    expect(ids).toContain(post4Id);
    expect(ids).toContain(post5Id);
    expect(ids).toContain(post7Id);
    expect(ids).not.toContain(post2Id); // FOLLOWERS
    expect(ids).not.toContain(post3Id); // PRIVATE
  });

  test("3. Following Feed returns posts only from followed users", async () => {
    // User A follows User B
    const resA = await request(app)
      .get("/api/feed/following")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(resA.statusCode).toBe(200);
    const idsA = resA.body.items.map((i) => i.id);
    expect(idsA).toContain(post1Id);
    expect(idsA).toContain(post2Id);
    expect(idsA).not.toContain(post4Id); // C is not followed

    // User C follows nobody
    const resC = await request(app)
      .get("/api/feed/following")
      .set("Authorization", `Bearer ${userCToken}`);

    expect(resC.statusCode).toBe(200);
    expect(resC.body.items.length).toBe(0);
    expect(resC.body.total).toBe(0);
  });

  test("4. Community Feed returns posts belonging to one community", async () => {
    const res = await request(app)
      .get(`/api/communities/${pubCommunityId}/feed`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.items.some((i) => i.id === post5Id)).toBe(true);

    // Non-member accessing private community feed
    const privRes = await request(app)
      .get(`/api/communities/${privCommunityId}/feed`)
      .set("Authorization", `Bearer ${userCToken}`);

    expect(privRes.statusCode).toBe(403);
  });

  test("5. User Feed returns posts created by specific user", async () => {
    // User A (follower) gets User B's feed
    const resFollower = await request(app)
      .get(`/api/users/${userBId}/feed`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(resFollower.statusCode).toBe(200);
    const idsF = resFollower.body.items.map((i) => i.id);
    expect(idsF).toContain(post1Id);
    expect(idsF).toContain(post2Id);
    expect(idsF).not.toContain(post3Id); // PRIVATE

    // User B (author) gets own feed -> includes PRIVATE
    const resAuthor = await request(app)
      .get(`/api/users/${userBId}/feed`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resAuthor.statusCode).toBe(200);
    const idsAuth = resAuthor.body.items.map((i) => i.id);
    expect(idsAuth).toContain(post1Id);
    expect(idsAuth).toContain(post2Id);
    expect(idsAuth).toContain(post3Id);
  });

  test("6. Pagination support (page & limit)", async () => {
    const res = await request(app)
      .get("/api/feed?page=1&limit=2")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.items.length).toBe(2);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("totalPages");
    expect(res.body.hasNext).toBe(true);
    expect(res.body.hasPrevious).toBe(false);
  });

  test("7. Search Inside Feed by post content", async () => {
    const res = await request(app)
      .get("/api/feed/search?q=tech")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.items.some((i) => i.id === post1Id)).toBe(true);
    expect(res.body.items.some((i) => i.id === post4Id)).toBe(false);
  });

  test("8. Visibility Rules and Guest Access", async () => {
    // Guest request (no token header)
    const resGuest = await request(app).get("/api/feed");

    expect(resGuest.statusCode).toBe(200);
    const idsG = resGuest.body.items.map((i) => i.id);
    expect(idsG).toContain(post1Id);
    expect(idsG).toContain(post4Id);
    expect(idsG).not.toContain(post2Id); // FOLLOWERS
    expect(idsG).not.toContain(post3Id); // PRIVATE

    const item = resGuest.body.items[0];
    expect(item.isLiked).toBe(false);
    expect(item.isSaved).toBe(false);
    expect(item.isFollowingAuthor).toBe(false);
  });

  test("9. Filtering by visibility parameter", async () => {
    const res = await request(app)
      .get("/api/feed?visibility=PUBLIC")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.items.every((i) => i.visibility === "PUBLIC")).toBe(true);
  });

  test("10. Empty feed response when no matching criteria", async () => {
    const res = await request(app)
      .get("/api/feed/search?q=nonexistentquery_987654")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.totalPages).toBe(0);
    expect(res.body.hasNext).toBe(false);
    expect(res.body.hasPrevious).toBe(false);
  });
});
