const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

const REPORT_TARGET_TYPES = ["USER", "POST", "COMMENT", "JOB", "PROJECT", "COMMUNITY"];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function normalizeTargetType(value) {
  if (!value) {return null;}
  return String(value).trim().toUpperCase();
}

function normalizePagination(options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

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

async function ensureTargetExists(targetType, targetId) {
  if (!REPORT_TARGET_TYPES.includes(targetType)) {
    throw new AppError(400, "Invalid report target type");
  }

  let target;
  switch (targetType) {
    case "USER":
      target = await prisma.user.findUnique({ where: { id: targetId } });
      break;
    case "POST":
      target = await prisma.post.findUnique({ where: { id: targetId } });
      break;
    case "COMMENT":
      target = await prisma.comment.findUnique({ where: { id: targetId } });
      break;
    case "JOB":
      target = await prisma.job.findUnique({ where: { id: targetId } });
      break;
    case "PROJECT":
      target = await prisma.project.findUnique({ where: { id: targetId } });
      break;
    case "COMMUNITY":
      target = await prisma.community.findUnique({ where: { id: targetId } });
      break;
    default:
      target = null;
  }

  if (!target) {
    throw new AppError(404, `${targetType} not found`);
  }

  return target;
}

async function createReport(reporterId, data) {
  const targetType = normalizeTargetType(data.targetType);
  const targetId = String(data.targetId).trim();
  const reason = String(data.reason).trim();
  const details = data.details ? String(data.details).trim() : null;

  await ensureTargetExists(targetType, targetId);

  return prisma.report.create({
    data: {
      reporterId,
      targetType,
      targetId,
      reason,
      details,
      status: "PENDING",
    },
  });
}

async function listUserReports(userId, options = {}) {
  const { page, limit, skip } = normalizePagination(options);
  const where = { reporterId: userId };

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

module.exports = {
  createReport,
  listUserReports,
};
