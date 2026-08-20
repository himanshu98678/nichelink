const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const notificationService = require("./notificationService");
const communityService = require("./communityService");
const feedService = require("./feedService");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

async function createPost(userId, { content, images = [], tags = [], communityId = null, visibility = "PUBLIC" }) {
  if ((!content || !content.trim()) && (!images || images.length === 0)) {
    throw new AppError(400, "Post must have content or at least one image");
  }

  if (content && content.length > 5000) {
    throw new AppError(400, "Content must be 5000 characters or fewer");
  }

  const cleanTags = Array.isArray(tags)
    ? tags.filter((t) => t && typeof t === "string").map((t) => t.trim().replace(/^#/, ""))
    : [];

  if (communityId) {
    await communityService.ensureCommunityAccess(userId, communityId);
  }

  const post = await prisma.post.create({
    data: {
      authorId: userId,
      content: content || "",
      images,
      tags: cleanTags,
      visibility,
      communityId,
    },
  });
  feedService.clearFeedCache();
  if (content) {
    await notificationService.handleMentions(userId, content, post.id, "POST").catch(() => null);
  }

  return getPost(post.id);
}

async function getPost(postId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true, username: true, avatar: true } },
      community: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!post) {throw new AppError(404, "Post not found");}

  return post;
}

async function getPostAccessible(userId, postId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true, username: true, avatar: true } },
      community: { select: { id: true, name: true, slug: true, visibility: true } },
      likes: userId ? { where: { userId } } : undefined,
      saves: userId ? { where: { userId } } : undefined,
    },
  });

  if (!post) {throw new AppError(404, "Post not found");}
  if (!userId || post.authorId === userId) {
    if (post.communityId) {
      await communityService.ensureCommunityAccess(userId, post.communityId);
    }
    return post;
  }

  const context = await feedService.getUserAccessContext(userId);
  const where = {
    id: postId,
    AND: [feedService.buildVisibilityCondition(context)],
  };

  const accessiblePost = await prisma.post.findFirst({
    where,
    include: {
      author: { select: { id: true, name: true, username: true, avatar: true } },
      community: { select: { id: true, name: true, slug: true, visibility: true } },
      likes: userId ? { where: { userId } } : undefined,
      saves: userId ? { where: { userId } } : undefined,
    },
  });

  if (!accessiblePost) {
    throw new AppError(403, "Forbidden to access this post");
  }

  return accessiblePost;
}

async function listPosts(userId, { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, communityId, authorId } = {}) {
  const skip = (page - 1) * limit;
  const customFilters = [];
  if (communityId) {customFilters.push({ communityId });}
  if (authorId) {customFilters.push({ authorId });}

  const context = await feedService.getUserAccessContext(userId);
  const visibilityWhere = feedService.buildVisibilityCondition(context);

  const where = {
    AND: [visibilityWhere, ...customFilters].filter(Boolean),
  };

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      author: { select: { id: true, name: true, username: true, avatar: true } },
      community: { select: { id: true, name: true, slug: true } },
      likes: userId ? { where: { userId } } : undefined,
      saves: userId ? { where: { userId } } : undefined,
    },
  });

  const total = await prisma.post.count({ where });

  return { posts, total, page, limit };
}

async function updatePost(userId, postId, { content, images, tags, visibility }) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {throw new AppError(404, "Post not found");}
  if (post.authorId !== userId) {throw new AppError(403, "Unauthorized to edit this post");}

  if (content && content.length > 5000) {throw new AppError(400, "Content must be 5000 characters or fewer");}

  const cleanTags = tags !== undefined
    ? (Array.isArray(tags) ? tags.filter((t) => t && typeof t === "string").map((t) => t.trim().replace(/^#/, "")) : [])
    : post.tags || [];

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      content: content !== undefined ? content : post.content,
      images: images !== undefined ? images : post.images,
      tags: cleanTags,
      visibility: visibility !== undefined ? visibility : post.visibility,
      editedAt: new Date(),
    },
  });

  feedService.clearFeedCache();
  return getPost(updated.id);
}

async function deletePost(userId, postId) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {throw new AppError(404, "Post not found");}
  if (post.authorId !== userId) {throw new AppError(403, "Unauthorized to delete this post");}

  await prisma.post.delete({ where: { id: postId } });
  feedService.clearFeedCache();
  return true;
}

async function toggleLike(userId, postId) {
  const post = await getPostAccessible(userId, postId);

  const existing = await prisma.postLike.findUnique({ where: { userId_postId: { userId, postId } } }).catch(() => null);

  if (existing) {
    await prisma.$transaction([
      prisma.postLike.delete({ where: { id: existing.id } }),
      prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
    ]);

    feedService.clearFeedCache();
    return { liked: false };
  }

  await prisma.$transaction([
    prisma.postLike.create({ data: { userId, postId } }),
    prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
  ]);

  feedService.clearFeedCache();

  if (post.authorId !== userId) {
    const liker = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await notificationService.createNotification({
      recipientId: post.authorId,
      senderId: userId,
      type: "LIKE",
      title: "New Like",
      message: `${liker?.username || "Someone"} liked your post`,
      referenceId: postId,
      referenceType: "POST",
    }).catch(() => null);
  }

  return { liked: true };
}

async function removeLike(userId, postId) {
  await getPostAccessible(userId, postId);

  const removed = await prisma.$transaction(async (transaction) => {
    const result = await transaction.postLike.deleteMany({ where: { userId, postId } });
    if (result.count > 0) {
      await transaction.post.update({ where: { id: postId }, data: { likeCount: { decrement: result.count } } });
    }
    return result.count;
  });

  if (removed > 0) {
    feedService.clearFeedCache();
  }

  return { liked: false, removed: removed > 0 };
}

async function toggleSave(userId, postId) {
  await getPostAccessible(userId, postId);

  const existing = await prisma.postSave.findUnique({ where: { postId_userId: { postId, userId } } }).catch(() => null);

  if (existing) {
    await prisma.$transaction([
      prisma.postSave.delete({ where: { id: existing.id } }),
      prisma.post.update({ where: { id: postId }, data: { saveCount: { decrement: 1 } } }),
    ]);

    feedService.clearFeedCache();
    return { saved: false };
  }

  await prisma.$transaction([
    prisma.postSave.create({ data: { postId, userId } }),
    prisma.post.update({ where: { id: postId }, data: { saveCount: { increment: 1 } } }),
  ]);

  feedService.clearFeedCache();
  return { saved: true };
}

async function removeSave(userId, postId) {
  await getPostAccessible(userId, postId);

  const removed = await prisma.$transaction(async (transaction) => {
    const result = await transaction.postSave.deleteMany({ where: { postId, userId } });
    if (result.count > 0) {
      await transaction.post.update({ where: { id: postId }, data: { saveCount: { decrement: result.count } } });
    }
    return result.count;
  });

  if (removed > 0) {
    feedService.clearFeedCache();
  }

  return { saved: false, removed: removed > 0 };
}

async function sharePost(userId, postId, message) {
  const post = await getPostAccessible(userId, postId);

  const share = await prisma.$transaction(async (tx) => {
    const s = await tx.postShare.create({ data: { postId, userId, message } });
    await tx.post.update({ where: { id: postId }, data: { shareCount: { increment: 1 } } });
    return s;
  });

  feedService.clearFeedCache();

  if (post.authorId !== userId) {
    const sharer = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await notificationService.createNotification({
      recipientId: post.authorId,
      senderId: userId,
      type: "POST_SHARED",
      title: "Post Shared",
      message: `${sharer?.username || "Someone"} shared your post`,
      referenceId: postId,
      referenceType: "POST",
    }).catch(() => null);
  }

  return share;
}

async function listSavedPosts(userId, { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) {
  const skip = (page - 1) * limit;

  const [saved, total] = await Promise.all([
    prisma.postSave.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        post: {
          include: {
            author: { select: { id: true, name: true, username: true, avatar: true } },
            community: { select: { id: true, name: true, slug: true } },
            likes: userId ? { where: { userId } } : undefined,
            saves: userId ? { where: { userId } } : undefined,
          },
        },
      },
    }),
    prisma.postSave.count({ where: { userId } }),
  ]);

  const posts = saved.map((s) => s.post);
  return { posts, total, page, limit };
}

module.exports = {
  createPost,
  getPost,
  getPostAccessible,
  listPosts,
  updatePost,
  deletePost,
  toggleLike,
  removeLike,
  toggleSave,
  removeSave,
  sharePost,
  listSavedPosts,
};
