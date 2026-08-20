const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const FEED_CACHE_TTL_SECONDS = Number(process.env.FEED_CACHE_TTL_SECONDS) || 30;

const feedCache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
};

/**
 * Caching helpers (prepared for future Redis implementation)
 */
function buildFeedCacheKey(feedType, userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    q = "",
    communityId = "",
    authorId = "",
    visibility = "",
    from = "",
    to = "",
    sortBy = "",
    sortOrder = "desc",
  } = options;
  return `feed:${feedType}:u_${userId || "guest"}:p_${page}:l_${limit}:q_${q}:c_${communityId}:a_${authorId}:v_${visibility}:f_${from}:t_${to}:s_${sortBy}:o_${sortOrder}`;
}

async function getCachedFeed(cacheKey) {
  const entry = feedCache.get(cacheKey);
  if (!entry) {
    cacheStats.misses += 1;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    feedCache.delete(cacheKey);
    cacheStats.misses += 1;
    return null;
  }

  cacheStats.hits += 1;
  return entry.data;
}

async function setCachedFeed(cacheKey, data, ttlSeconds = FEED_CACHE_TTL_SECONDS) {
  feedCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return true;
}

function clearFeedCache(prefix = "") {
  if (!prefix) {
    feedCache.clear();
    return;
  }

  for (const key of feedCache.keys()) {
    if (key.startsWith(prefix)) {
      feedCache.delete(key);
    }
  }
}

function getFeedCacheStats() {
  return { ...cacheStats };
}

/**
 * Strategy-based sorting helper
 */
function getSortOrder(sortBy = "createdAt", order = "desc") {
  const direction = String(order).toLowerCase() === "asc" ? "asc" : "desc";
  const orderSettings = [];

  switch (String(sortBy).toLowerCase()) {
    case "trending":
      orderSettings.push({ likeCount: direction }, { commentCount: direction }, { createdAt: direction });
      break;
    case "popular":
      orderSettings.push({ likeCount: direction }, { saveCount: direction }, { createdAt: direction });
      break;
    case "recommended":
      orderSettings.push({ commentCount: direction }, { createdAt: direction });
      break;
    case "createdat":
    default:
      orderSettings.push({ createdAt: direction });
      break;
  }

  orderSettings.push({ id: direction });
  return orderSettings;
}

/**
 * Helper to fetch user follows and community memberships
 */
async function getUserAccessContext(userId) {
  if (!userId) {
    return {
      userId: null,
      followedUserIds: [],
      joinedCommunityIds: [],
    };
  }

  const [follows, memberships] = await Promise.all([
    prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }),
    prisma.communityMember.findMany({
      where: { userId },
      select: { communityId: true },
    }),
  ]);

  return {
    userId,
    followedUserIds: follows.map((f) => f.followingId),
    joinedCommunityIds: memberships.map((m) => m.communityId),
  };
}

/**
 * Constructs security visibility rules
 */
function buildVisibilityCondition(context) {
  const { userId, followedUserIds, joinedCommunityIds } = context;

  if (!userId) {
    return {
      visibility: "PUBLIC",
      OR: [
        { communityId: null },
        { community: { visibility: "public" } },
      ],
    };
  }

  return {
    OR: [
      { authorId: userId },
      {
        AND: [
          {
            OR: [
              { communityId: null },
              { community: { visibility: "public" } },
              ...(joinedCommunityIds.length > 0
                ? [{ communityId: { in: joinedCommunityIds } }]
                : []),
            ],
          },
          {
            OR: [
              { visibility: "PUBLIC" },
              ...(followedUserIds.length > 0
                ? [
                    {
                      visibility: "FOLLOWERS",
                      authorId: { in: followedUserIds },
                    },
                  ]
                : []),
              ...(joinedCommunityIds.length > 0
                ? [{ communityId: { in: joinedCommunityIds } }]
                : []),
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Builds custom filters (communityId, authorId, visibility, dates)
 */
function buildCustomFilters(options = {}) {
  const filters = [];

  if (options.communityId) {
    filters.push({ communityId: options.communityId });
  }

  if (options.authorId) {
    filters.push({ authorId: options.authorId });
  }

  if (options.visibility) {
    filters.push({ visibility: options.visibility });
  }

  if (options.from || options.to) {
    const dateFilter = {};
    if (options.from) {dateFilter.gte = new Date(options.from);}
    if (options.to) {dateFilter.lte = new Date(options.to);}
    filters.push({ createdAt: dateFilter });
  }

  return filters;
}

/**
 * Bulk enriches post items to prevent N+1 queries
 */
async function enrichPostsWithUserContext(posts, currentUserId) {
  if (!posts || posts.length === 0) {return [];}

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.authorId))];

  let likedSet = new Set();
  let savedSet = new Set();
  let followingSet = new Set();

  if (currentUserId) {
    const [likes, saves, follows] = await Promise.all([
      prisma.postLike.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
      prisma.postSave.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
      prisma.userFollow.findMany({
        where: { followerId: currentUserId, followingId: { in: authorIds } },
        select: { followingId: true },
      }),
    ]);

    likedSet = new Set(likes.map((l) => l.postId));
    savedSet = new Set(saves.map((s) => s.postId));
    followingSet = new Set(follows.map((f) => f.followingId));
  }

  return posts.map((post) => ({
    id: post.id,
    author: {
      id: post.author.id,
      name: post.author.name,
      username: post.author.username,
      avatar: post.author.avatar || null,
    },
    avatar: post.author.avatar || null,
    username: post.author.username,
    community: post.community
      ? {
          id: post.community.id,
          name: post.community.name,
          slug: post.community.slug,
        }
      : null,
    createdAt: post.createdAt,
    editedAt: post.editedAt || null,
    content: post.content,
    images: post.images || [],
    visibility: post.visibility,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    shareCount: post.shareCount,
    saveCount: post.saveCount,
    isLiked: likedSet.has(post.id),
    isSaved: savedSet.has(post.id),
    isFollowingAuthor: followingSet.has(post.authorId),
  }));
}

function buildPaginationResult({ items, total, page, limit }) {
  const p = Number(page) || DEFAULT_PAGE;
  const l = Number(limit) || DEFAULT_LIMIT;
  const totalPages = Math.ceil(total / l) || 0;

  return {
    items,
    page: p,
    limit: l,
    total,
    totalPages,
    hasNext: p < totalPages,
    hasPrevious: p > 1,
  };
}

const defaultInclude = {
  author: { select: { id: true, name: true, username: true, avatar: true } },
  community: { select: { id: true, name: true, slug: true, visibility: true } },
};

/**
 * 1. Home Feed
 */
async function getHomeFeed(userId, options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const cacheKey = buildFeedCacheKey("home", userId, options);
  const cached = await getCachedFeed(cacheKey);
  if (cached) {return cached;}

  const context = await getUserAccessContext(userId);
  const visibilityWhere = buildVisibilityCondition(context);
  const customFilters = buildCustomFilters(options);

  let searchWhere = {};
  if (options.q && options.q.trim()) {
    const q = options.q.trim();
    searchWhere = {
      OR: [
        { content: { contains: q, mode: "insensitive" } },
        { community: { name: { contains: q, mode: "insensitive" } } },
        { author: { username: { contains: q, mode: "insensitive" } } },
        { author: { name: { contains: q, mode: "insensitive" } } },
      ],
    };
  }

  const where = {
    AND: [visibilityWhere, ...customFilters, searchWhere].filter(
      (c) => Object.keys(c).length > 0
    ),
  };

  const orderBy = getSortOrder(options.sortBy, options.sortOrder);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: defaultInclude,
    }),
    prisma.post.count({ where }),
  ]);

  const items = await enrichPostsWithUserContext(posts, userId);
  const result = buildPaginationResult({ items, total, page, limit });
  await setCachedFeed(cacheKey, result);
  return result;
}

/**
 * 2. Latest Feed
 */
async function getLatestFeed(userId, options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const cacheKey = buildFeedCacheKey("latest", userId, options);
  const cached = await getCachedFeed(cacheKey);
  if (cached) {return cached;}

  const customFilters = buildCustomFilters(options);

  let searchWhere = {};
  if (options.q && options.q.trim()) {
    const q = options.q.trim();
    searchWhere = {
      OR: [
        { content: { contains: q, mode: "insensitive" } },
        { community: { name: { contains: q, mode: "insensitive" } } },
        { author: { username: { contains: q, mode: "insensitive" } } },
        { author: { name: { contains: q, mode: "insensitive" } } },
      ],
    };
  }

  const where = {
    AND: [
      { visibility: "PUBLIC" },
      { OR: [{ communityId: null }, { community: { visibility: "public" } }] },
      ...customFilters,
      searchWhere,
    ].filter((c) => Object.keys(c).length > 0),
  };

  const orderBy = getSortOrder(options.sortBy, options.sortOrder);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: defaultInclude,
    }),
    prisma.post.count({ where }),
  ]);

  const items = await enrichPostsWithUserContext(posts, userId);
  const result = buildPaginationResult({ items, total, page, limit });
  await setCachedFeed(cacheKey, result);
  return result;
}

/**
 * 3. Following Feed
 */
async function getFollowingFeed(userId, options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;

  if (!userId) {
    return buildPaginationResult({ items: [], total: 0, page, limit });
  }

  const cacheKey = buildFeedCacheKey("following", userId, options);
  const cached = await getCachedFeed(cacheKey);
  if (cached) {return cached;}

  const context = await getUserAccessContext(userId);
  if (context.followedUserIds.length === 0) {
    const result = buildPaginationResult({ items: [], total: 0, page, limit });
    await setCachedFeed(cacheKey, result);
    return result;
  }

  const skip = (page - 1) * limit;
  const visibilityWhere = buildVisibilityCondition(context);
  const customFilters = buildCustomFilters(options);

  let searchWhere = {};
  if (options.q && options.q.trim()) {
    const q = options.q.trim();
    searchWhere = {
      OR: [
        { content: { contains: q, mode: "insensitive" } },
        { community: { name: { contains: q, mode: "insensitive" } } },
        { author: { username: { contains: q, mode: "insensitive" } } },
        { author: { name: { contains: q, mode: "insensitive" } } },
      ],
    };
  }

  const where = {
    AND: [
      { authorId: { in: context.followedUserIds } },
      visibilityWhere,
      ...customFilters,
      searchWhere,
    ].filter((c) => Object.keys(c).length > 0),
  };

  const orderBy = getSortOrder(options.sortBy, options.sortOrder);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: defaultInclude,
    }),
    prisma.post.count({ where }),
  ]);

  const items = await enrichPostsWithUserContext(posts, userId);
  const result = buildPaginationResult({ items, total, page, limit });
  await setCachedFeed(cacheKey, result);
  return result;
}

/**
 * 4. Community Feed
 */
async function getCommunityFeed(communityId, userId, options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const community = await prisma.community.findUnique({
    where: { id: communityId },
  });

  if (!community) {
    throw new AppError(404, "Community not found");
  }

  const context = await getUserAccessContext(userId);

  if (community.visibility === "private") {
    const isOwner = community.ownerId === userId;
    const isMember = context.joinedCommunityIds.includes(communityId);
    if (!isOwner && !isMember) {
      throw new AppError(403, "Access denied to private community feed");
    }
  }

  const cacheKey = buildFeedCacheKey(`community:${communityId}`, userId, options);
  const cached = await getCachedFeed(cacheKey);
  if (cached) {return cached;}

  const visibilityWhere = buildVisibilityCondition(context);
  const customFilters = buildCustomFilters(options);

  let searchWhere = {};
  if (options.q && options.q.trim()) {
    const q = options.q.trim();
    searchWhere = {
      OR: [
        { content: { contains: q, mode: "insensitive" } },
        { community: { name: { contains: q, mode: "insensitive" } } },
        { author: { username: { contains: q, mode: "insensitive" } } },
        { author: { name: { contains: q, mode: "insensitive" } } },
      ],
    };
  }

  const where = {
    AND: [
      { communityId },
      visibilityWhere,
      ...customFilters,
      searchWhere,
    ].filter((c) => Object.keys(c).length > 0),
  };

  const orderBy = getSortOrder(options.sortBy, options.sortOrder);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: defaultInclude,
    }),
    prisma.post.count({ where }),
  ]);

  const items = await enrichPostsWithUserContext(posts, userId);
  const result = buildPaginationResult({ items, total, page, limit });
  await setCachedFeed(cacheKey, result);
  return result;
}

/**
 * 5. User Feed
 */
async function getUserFeed(targetUserId, userId, options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new AppError(404, "User not found");
  }

  const cacheKey = buildFeedCacheKey(`user:${targetUserId}`, userId, options);
  const cached = await getCachedFeed(cacheKey);
  if (cached) {return cached;}

  const context = await getUserAccessContext(userId);
  const visibilityWhere = buildVisibilityCondition(context);
  const customFilters = buildCustomFilters(options);

  let searchWhere = {};
  if (options.q && options.q.trim()) {
    const q = options.q.trim();
    searchWhere = {
      OR: [
        { content: { contains: q, mode: "insensitive" } },
        { community: { name: { contains: q, mode: "insensitive" } } },
        { author: { username: { contains: q, mode: "insensitive" } } },
        { author: { name: { contains: q, mode: "insensitive" } } },
      ],
    };
  }

  const where = {
    AND: [
      { authorId: targetUserId },
      visibilityWhere,
      ...customFilters,
      searchWhere,
    ].filter((c) => Object.keys(c).length > 0),
  };

  const orderBy = getSortOrder(options.sortBy, options.sortOrder);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: defaultInclude,
    }),
    prisma.post.count({ where }),
  ]);

  const items = await enrichPostsWithUserContext(posts, userId);
  const result = buildPaginationResult({ items, total, page, limit });
  await setCachedFeed(cacheKey, result);
  return result;
}

/**
 * 6. Search Feed
 */
async function searchFeed(options = {}, userId) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const q = options.q ? options.q.trim() : "";

  const cacheKey = buildFeedCacheKey("search", userId, options);
  const cached = await getCachedFeed(cacheKey);
  if (cached) {return cached;}

  const context = await getUserAccessContext(userId);
  const visibilityWhere = buildVisibilityCondition(context);
  const customFilters = buildCustomFilters(options);

  let searchWhere = {};
  if (q) {
    searchWhere = {
      OR: [
        { content: { contains: q, mode: "insensitive" } },
        { community: { name: { contains: q, mode: "insensitive" } } },
        { author: { username: { contains: q, mode: "insensitive" } } },
        { author: { name: { contains: q, mode: "insensitive" } } },
      ],
    };
  }

  const where = {
    AND: [visibilityWhere, ...customFilters, searchWhere].filter(
      (c) => Object.keys(c).length > 0
    ),
  };

  const orderBy = getSortOrder(options.sortBy, options.sortOrder);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: defaultInclude,
    }),
    prisma.post.count({ where }),
  ]);

  const items = await enrichPostsWithUserContext(posts, userId);
  const result = buildPaginationResult({ items, total, page, limit });
  await setCachedFeed(cacheKey, result);
  return result;
}

module.exports = {
  getHomeFeed,
  getLatestFeed,
  getFollowingFeed,
  getCommunityFeed,
  getUserFeed,
  searchFeed,
  // Helper methods exported for testing/extensibility
  buildFeedCacheKey,
  getCachedFeed,
  setCachedFeed,
  clearFeedCache,
  getFeedCacheStats,
  getSortOrder,
  enrichPostsWithUserContext,
  getUserAccessContext,
  buildVisibilityCondition,
};
