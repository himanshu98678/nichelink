const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const notificationService = require("./notificationService");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function buildPaginationResult(items, total, page, limit) {
  const totalPages = Math.ceil(total / limit) || 0;
  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

function normalizePagination(options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildSortOrder(sortBy, sortOrder, allowedFields = ["createdAt", "updatedAt"]) {
  const order = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";
  if (!sortBy || !allowedFields.includes(sortBy)) {return { createdAt: "desc" };}
  return { [sortBy]: order };
}

async function getAdminDashboard() {
  const lastSevenDays = new Date();
  lastSevenDays.setDate(lastSevenDays.getDate() - 7);

  const [
    totalUsers,
    totalProjects,
    totalTasks,
    totalPosts,
    totalComments,
    totalJobs,
    totalCommunities,
    pendingReports,
    newUsersLast7Days,
    newPostsLast7Days,
    newCommentsLast7Days,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.job.count(),
    prisma.community.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { createdAt: { gte: lastSevenDays } } }),
    prisma.post.count({ where: { createdAt: { gte: lastSevenDays } } }),
    prisma.comment.count({ where: { createdAt: { gte: lastSevenDays } } }),
  ]);

  return {
    totals: {
      users: totalUsers,
      projects: totalProjects,
      tasks: totalTasks,
      posts: totalPosts,
      comments: totalComments,
      jobs: totalJobs,
      communities: totalCommunities,
      pendingReports,
    },
    trends: {
      newUsersLast7Days,
      newPostsLast7Days,
      newCommentsLast7Days,
    },
  };
}

async function getAdminAnalytics() {
  const [topAuthors, topCommunities, openJobs, activeProjects] = await Promise.all([
    prisma.user.findMany({
      take: 5,
      orderBy: { posts: { _count: "desc" } },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        _count: { select: { posts: true, comments: true } },
      },
    }),
    prisma.community.findMany({
      take: 5,
      orderBy: { posts: { _count: "desc" } },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.job.count({ where: { status: "OPEN" } }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
  ]);

  return {
    topAuthors,
    topCommunities,
    openJobs,
    activeProjects,
  };
}

async function listUsers(options = {}) {
  const { page, limit, skip } = normalizePagination(options);
  const where = {};

  if (options.role) {
    where.role = options.role;
  }
  if (options.q) {
    where.OR = [
      { name: { contains: options.q.trim(), mode: "insensitive" } },
      { username: { contains: options.q.trim(), mode: "insensitive" } },
      { email: { contains: options.q.trim(), mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: buildSortOrder(options.sortBy, options.sortOrder, ["createdAt", "updatedAt", "name", "username", "email", "role"]),
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, limit);
}

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatar: true,
      coverImage: true,
      bio: true,
      skills: true,
      socialLinks: true,
      experience: true,
      education: true,
      portfolioLinks: true,
      visibility: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
}

async function listCommunities(options = {}) {
  const { page, limit, skip } = normalizePagination(options);
  const where = {};

  if (options.q) {
    where.OR = [
      { name: { contains: options.q.trim(), mode: "insensitive" } },
      { description: { contains: options.q.trim(), mode: "insensitive" } },
      { slug: { contains: options.q.trim(), mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.community.findMany({
      where,
      orderBy: buildSortOrder(options.sortBy, options.sortOrder, ["createdAt", "updatedAt", "name", "slug"]),
      skip,
      take: limit,
      include: {
        owner: { select: { id: true, name: true, username: true, email: true } },
      },
    }),
    prisma.community.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, limit);
}

async function listPosts(options = {}) {
  const { page, limit, skip } = normalizePagination(options);
  const where = {};

  if (options.q) {
    where.OR = [
      { content: { contains: options.q.trim(), mode: "insensitive" } },
      { author: { name: { contains: options.q.trim(), mode: "insensitive" } } },
      { community: { name: { contains: options.q.trim(), mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: buildSortOrder(options.sortBy, options.sortOrder, ["createdAt", "updatedAt"]),
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, username: true, email: true } },
        community: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, limit);
}

async function listComments(options = {}) {
  const { page, limit, skip } = normalizePagination(options);
  const where = {};

  if (options.q) {
    where.OR = [
      { content: { contains: options.q.trim(), mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: buildSortOrder(options.sortBy, options.sortOrder, ["createdAt", "updatedAt"]),
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, username: true, email: true } },
        post: { select: { id: true, content: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, limit);
}

async function listJobs(options = {}) {
  const { page, limit, skip } = normalizePagination(options);
  const where = {};

  if (options.status) {
    where.status = options.status;
  }
  if (options.q) {
    where.OR = [
      { title: { contains: options.q.trim(), mode: "insensitive" } },
      { company: { contains: options.q.trim(), mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: buildSortOrder(options.sortBy, options.sortOrder, ["createdAt", "updatedAt", "title", "status"]),
      skip,
      take: limit,
      include: {
        postedBy: { select: { id: true, name: true, username: true, email: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, limit);
}

async function listProjects(options = {}) {
  const { page, limit, skip } = normalizePagination(options);
  const where = {};

  if (options.status) {
    where.status = options.status;
  }
  if (options.q) {
    where.OR = [
      { title: { contains: options.q.trim(), mode: "insensitive" } },
      { description: { contains: options.q.trim(), mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: buildSortOrder(options.sortBy, options.sortOrder, ["createdAt", "updatedAt", "title", "status"]),
      skip,
      take: limit,
      include: {
        owner: { select: { id: true, name: true, username: true, email: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, limit);
}

async function listReports(options = {}) {
  const { page, limit, skip } = normalizePagination(options);
  const where = {};

  if (options.status) {
    where.status = options.status;
  }
  if (options.targetType) {
    where.targetType = options.targetType;
  }

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        reporter: { select: { id: true, name: true, username: true, email: true } },
        resolvedBy: { select: { id: true, name: true, username: true, email: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return buildPaginationResult(items, total, page, limit);
}

async function resolveReport(adminId, reportId, action, resolutionNotes) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) {
    throw new AppError(404, "Report not found");
  }
  if (report.status !== "PENDING") {
    throw new AppError(400, "Only pending reports can be resolved");
  }

  const updatedReport = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: action,
      resolvedById: adminId,
      resolvedAt: new Date(),
      resolutionNotes: resolutionNotes ?? null,
    },
  });

  await notificationService.createNotification({
    recipientId: report.reporterId,
    senderId: adminId,
    type: "REPORT_RESOLVED",
    title: "Report reviewed",
    message: `Your report has been ${action.toLowerCase()}.`,
    referenceId: report.id,
    referenceType: "REPORT",
  }).catch(() => null);

  return updatedReport;
}

async function deleteUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found");
  }
  if (user.role === "SUPER_ADMIN") {
    throw new AppError(403, "Cannot delete SUPER_ADMIN users");
  }
  return prisma.user.delete({ where: { id: userId } });
}

async function deleteCommunity(communityId) {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) {
    throw new AppError(404, "Community not found");
  }
  return prisma.community.delete({ where: { id: communityId } });
}

async function deletePost(postId) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new AppError(404, "Post not found");
  }
  return prisma.post.delete({ where: { id: postId } });
}

async function deleteComment(commentId) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw new AppError(404, "Comment not found");
  }
  return prisma.comment.delete({ where: { id: commentId } });
}

async function deleteJob(jobId) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new AppError(404, "Job not found");
  }
  return prisma.job.delete({ where: { id: jobId } });
}

async function deleteProject(projectId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new AppError(404, "Project not found");
  }
  return prisma.project.delete({ where: { id: projectId } });
}

module.exports = {
  getAdminDashboard,
  getAdminAnalytics,
  listUsers,
  getUserById,
  listCommunities,
  listPosts,
  listComments,
  listJobs,
  listProjects,
  listReports,
  resolveReport,
  deleteUser,
  deleteCommunity,
  deletePost,
  deleteComment,
  deleteJob,
  deleteProject,
};
