const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const notificationService = require("./notificationService");
const postService = require("./postService");
const feedService = require("./feedService");

async function createComment(userId, postId, { content, parentId = null }) {
  if (!content || !content.trim()) {throw new AppError(400, "Comment content is required");}
  if (content.length > 2000) {throw new AppError(400, "Comment must be 2000 characters or fewer");}

  const post = await postService.getPostAccessible(userId, postId);

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { postId: true } });
    if (!parent) {throw new AppError(404, "Parent comment not found");}
    if (parent.postId !== postId) {throw new AppError(400, "Parent comment must belong to the same post");}
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId,
      parentId,
      content,
    },
  });

  // increment commentCount on post
  await prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
  feedService.clearFeedCache();

  // Notifications
  const commenter = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  
  await notificationService.handleMentions(userId, content, comment.id, "COMMENT").catch(() => null);

  if (!parentId) {
    if (post.authorId !== userId) {
      await notificationService.createNotification({
        recipientId: post.authorId,
        senderId: userId,
        type: "COMMENT",
        title: "New Comment",
        message: `${commenter?.username || "Someone"} commented on your post`,
        referenceId: comment.id,
        referenceType: "COMMENT",
      }).catch(() => null);
    }
  } else {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (parent && parent.userId !== userId) {
      await notificationService.createNotification({
        recipientId: parent.userId,
        senderId: userId,
        type: "REPLY",
        title: "New Reply",
        message: `${commenter?.username || "Someone"} replied to your comment`,
        referenceId: comment.id,
        referenceType: "COMMENT",
      }).catch(() => null);
    }
  }

  return comment;
}

async function listComments(userId, postId) {
  await postService.getPostAccessible(userId, postId);

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
  });

  return comments;
}

async function updateComment(userId, commentId, { content }) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {throw new AppError(404, "Comment not found");}
  if (comment.userId !== userId) {throw new AppError(403, "Unauthorized to edit this comment");}

  if (content && content.length > 2000) {throw new AppError(400, "Comment must be 2000 characters or fewer");}

  const updated = await prisma.comment.update({ where: { id: commentId }, data: { content } });
  return updated;
}

async function deleteComment(userId, commentId) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {throw new AppError(404, "Comment not found");}
  if (comment.userId !== userId) {throw new AppError(403, "Unauthorized to delete this comment");}

  await prisma.$transaction([
    prisma.comment.delete({ where: { id: commentId } }),
    prisma.post.update({ where: { id: comment.postId }, data: { commentCount: { decrement: 1 } } }),
  ]);
  feedService.clearFeedCache();  return true;
}

async function replyComment(userId, commentId, { content }) {
  const parent = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!parent) {throw new AppError(404, "Parent comment not found");}

  const reply = await createComment(userId, parent.postId, { content, parentId: commentId });
  return reply;
}

module.exports = {
  createComment,
  listComments,
  updateComment,
  deleteComment,
  replyComment,
};
