const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

const PROJECT_STATUS_VALUES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
const PROJECT_PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const PROJECT_MEMBER_ROLES = ["OWNER", "MANAGER", "MEMBER"];

const normalizeProjectStatus = (value) => {
  if (value === undefined || value === null) {return undefined;}
  return String(value).trim().replace(/-/g, "_").toUpperCase();
};

const normalizeProjectPriority = (value) => {
  if (value === undefined || value === null) {return undefined;}
  return String(value).trim().toUpperCase();
};

const parseDateValue = (value) => {
  if (value === undefined) {return undefined;}
  if (value === null || value === "") {return null;}

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, "Invalid date value");
  }

  return date;
};

const ensureProjectAccess = async (userId, projectId) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
  });

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  return project;
};

const createProject = async (userId, data) => {
  const title = data.title?.trim() || data.name?.trim();
  const description = data.description?.trim() || null;
  const bannerImage = data.bannerImage?.trim() || null;
  const status = normalizeProjectStatus(data.status) || "PLANNING";
  const priority = normalizeProjectPriority(data.priority) || "MEDIUM";
  const startDate = parseDateValue(data.startDate);
  const deadline = parseDateValue(data.deadline);

  if (!title) {
    throw new AppError(400, "Project title is required");
  }

  if (!PROJECT_STATUS_VALUES.includes(status)) {
    throw new AppError(400, `Status must be one of: ${PROJECT_STATUS_VALUES.join(", ")}`);
  }

  if (!PROJECT_PRIORITY_VALUES.includes(priority)) {
    throw new AppError(400, `Priority must be one of: ${PROJECT_PRIORITY_VALUES.join(", ")}`);
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      bannerImage,
      status,
      priority,
      startDate,
      deadline,
      completedAt: status === "COMPLETED" ? new Date() : null,
      ownerId: userId,
      members: {
        create: [{ userId, role: "OWNER" }],
      },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  return project;
};

const listProjectsForUser = async (userId, options = {}) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const includeArchived = options.includeArchived === true || options.includeArchived === "true";
  const status = options.status ? normalizeProjectStatus(options.status) : undefined;
  const priority = options.priority ? normalizeProjectPriority(options.priority) : undefined;

  const where = {
    AND: [
      {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    ],
  };

  if (!includeArchived) {
    where.AND.push({ isArchived: false });
  }

  if (status) {
    if (!PROJECT_STATUS_VALUES.includes(status)) {
      throw new AppError(400, `Status filter must be one of: ${PROJECT_STATUS_VALUES.join(", ")}`);
    }
    where.AND.push({ status });
  }

  if (priority) {
    if (!PROJECT_PRIORITY_VALUES.includes(priority)) {
      throw new AppError(400, `Priority filter must be one of: ${PROJECT_PRIORITY_VALUES.join(", ")}`);
    }
    where.AND.push({ priority });
  }

  if (options.search) {
    where.AND.push({
      OR: [
        { title: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ],
    });
  }

  const sortBy = ["createdAt", "updatedAt", "title", "startDate", "deadline", "status", "priority"].includes(options.sortBy)
    ? options.sortBy
    : "createdAt";
  const order = options.order === "asc" ? "asc" : "desc";

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { [sortBy]: order },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    projects,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
};

const getProjectForUser = async (userId, projectId) => {
  await ensureProjectAccess(userId, projectId);

  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: { orderBy: { createdAt: "desc" } },
    },
  });
};

const updateProject = async (userId, projectId, data) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  if (!project) {
    throw new AppError(404, "Project not found or you are not the owner");
  }

  const payload = {};
  if (data.title !== undefined) {payload.title = data.title ? String(data.title).trim() : undefined;}
  if (data.name !== undefined) {payload.title = data.name ? String(data.name).trim() : undefined;}
  if (data.description !== undefined) {payload.description = data.description ? String(data.description).trim() : null;}
  if (data.bannerImage !== undefined) {payload.bannerImage = data.bannerImage ? String(data.bannerImage).trim() : null;}
  if (data.status !== undefined) {payload.status = normalizeProjectStatus(data.status);}
  if (data.priority !== undefined) {payload.priority = normalizeProjectPriority(data.priority);}
  if (data.startDate !== undefined) {payload.startDate = parseDateValue(data.startDate);}
  if (data.deadline !== undefined) {payload.deadline = parseDateValue(data.deadline);}

  if (payload.title !== undefined && !payload.title) {
    throw new AppError(400, "Project title is required");
  }

  if (payload.status !== undefined && !PROJECT_STATUS_VALUES.includes(payload.status)) {
    throw new AppError(400, `Status must be one of: ${PROJECT_STATUS_VALUES.join(", ")}`);
  }

  if (payload.priority !== undefined && !PROJECT_PRIORITY_VALUES.includes(payload.priority)) {
    throw new AppError(400, `Priority must be one of: ${PROJECT_PRIORITY_VALUES.join(", ")}`);
  }

  if (payload.startDate !== undefined && payload.startDate !== null && Number.isNaN(payload.startDate.getTime())) {
    throw new AppError(400, "Invalid start date");
  }

  if (payload.deadline !== undefined && payload.deadline !== null && Number.isNaN(payload.deadline.getTime())) {
    throw new AppError(400, "Invalid deadline");
  }

  if (payload.status === "COMPLETED") {
    payload.completedAt = project.completedAt || new Date();
  }

  if (payload.status !== undefined && payload.status !== "COMPLETED") {
    payload.completedAt = null;
  }

  if (Object.keys(payload).length === 0) {
    throw new AppError(400, "At least one project field must be provided for update");
  }

  return prisma.project.update({
    where: { id: projectId },
    data: payload,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
};

const archiveProject = async (userId, projectId) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  if (!project) {
    throw new AppError(404, "Project not found or you are not the owner");
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { isArchived: true, archivedAt: new Date() },
  });
};

const restoreProject = async (userId, projectId) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  if (!project) {
    throw new AppError(404, "Project not found or you are not the owner");
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { isArchived: false, archivedAt: null },
  });
};

const removeProjectMember = async (userId, projectId, memberId) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  if (!project) {
    throw new AppError(404, "Project not found or you are not the owner");
  }

  const member = await prisma.projectMember.findFirst({ where: { id: memberId, projectId } });
  if (!member) {
    throw new AppError(404, "Project member not found");
  }

  if (member.userId === userId) {
    throw new AppError(400, "Owner cannot remove themselves");
  }

  await prisma.projectMember.delete({ where: { id: memberId } });

  const notificationService = require("./notificationService");
  const remover = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  await notificationService
    .createNotification({
      recipientId: member.userId,
      senderId: userId,
      type: "PROJECT_REMOVED",
      title: "Removed from Project",
      message: `${remover?.username || "Someone"} removed you from project ${project.title}`,
      referenceId: projectId,
      referenceType: "PROJECT",
    })
    .catch(() => null);

  return true;
};

const getProjectStats = async (userId, projectId) => {
  await ensureProjectAccess(userId, projectId);

  const [totalTasks, todoCount, inProgressCount, reviewCount, doneCount, memberCount] = await Promise.all([
    prisma.task.count({ where: { projectId } }),
    prisma.task.count({ where: { projectId, status: "TODO" } }),
    prisma.task.count({ where: { projectId, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { projectId, status: "REVIEW" } }),
    prisma.task.count({ where: { projectId, status: "DONE" } }),
    prisma.projectMember.count({ where: { projectId } }),
  ]);

  const completedTasks = doneCount;
  const remainingTasks = totalTasks - doneCount;
  const progress = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    todoCount,
    inProgressCount,
    reviewCount,
    remainingTasks,
    memberCount,
    progress,
  };
};

const deleteProject = async (userId, projectId) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });

  if (!project) {
    throw new AppError(404, "Project not found or you are not the owner");
  }

  await prisma.project.delete({ where: { id: projectId } });
  return true;
};

const assignMemberToProject = async (userId, projectId, targetUserId, role = "MEMBER") => {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  if (!project) {
    throw new AppError(404, "Project not found or you are not the owner");
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw new AppError(404, "User not found");
  }

  const normalizedRole = String(role || "MEMBER").trim().toUpperCase();
  if (!PROJECT_MEMBER_ROLES.includes(normalizedRole) || normalizedRole === "OWNER") {
    throw new AppError(400, "Role must be one of: MANAGER, MEMBER");
  }

  const existingMember = await prisma.projectMember.findFirst({
    where: { projectId, userId: targetUserId },
  });

  if (existingMember) {
    if (existingMember.role !== normalizedRole) {
      return prisma.projectMember.update({
        where: { id: existingMember.id },
        data: { role: normalizedRole },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    }
    return existingMember;
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId: targetUserId,
      role: normalizedRole,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (targetUserId !== userId) {
    const notificationService = require("./notificationService");
    const assigner = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    await notificationService
      .createNotification({
        recipientId: targetUserId,
        senderId: userId,
        type: "PROJECT_INVITE",
        title: "Project Invitation",
        message: `${assigner?.username || "Someone"} invited you to project ${project.title}`,
        referenceId: projectId,
        referenceType: "PROJECT",
      })
      .catch(() => null);
  }

  return member;
};

const listProjectMembers = async (userId, projectId) => {
  await ensureProjectAccess(userId, projectId);
  return prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
};

const updateProjectMemberRole = async (userId, projectId, memberId, role) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  if (!project) {
    throw new AppError(404, "Project not found or you are not the owner");
  }

  const membership = await prisma.projectMember.findFirst({ where: { id: memberId, projectId } });
  if (!membership) {
    throw new AppError(404, "Project member not found");
  }

  const normalizedRole = String(role || "MEMBER").trim().toUpperCase();
  if (!PROJECT_MEMBER_ROLES.includes(normalizedRole) || normalizedRole === "OWNER") {
    throw new AppError(400, "Role must be one of: MANAGER, MEMBER");
  }

  return prisma.projectMember.update({
    where: { id: membership.id },
    data: { role: normalizedRole },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
};

const getProjectDashboard = async (userId, projectId) => {
  const project = await getProjectForUser(userId, projectId);
  const stats = await getProjectStats(userId, projectId);
  const fileCount = await prisma.projectFile.count({ where: { projectId } });
  const upcomingDeadlines = await prisma.task.findMany({
    where: {
      projectId,
      deadline: { not: null },
      status: { not: "DONE" },
    },
    select: {
      id: true,
      title: true,
      deadline: true,
      status: true,
      assignedTo: true,
    },
    orderBy: { deadline: "asc" },
    take: 5,
  });

  return {
    project,
    stats: { ...stats, fileCount },
    upcomingDeadlines,
  };
};

module.exports = {
  createProject,
  listProjectsForUser,
  getProjectForUser,
  updateProject,
  archiveProject,
  restoreProject,
  removeProjectMember,
  getProjectStats,
  deleteProject,
  assignMemberToProject,
  listProjectMembers,
  updateProjectMemberRole,
  getProjectDashboard,
  ensureProjectAccess,
};
