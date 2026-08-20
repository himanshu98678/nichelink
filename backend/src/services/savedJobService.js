const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * 1. Save Job
 */
async function saveJob(userId, jobId) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {throw new AppError(404, "Job not found");}

  const existing = await prisma.savedJob.findUnique({
    where: {
      userId_jobId: { userId, jobId },
    },
  });

  if (existing) {
    throw new AppError(400, "Job is already saved");
  }

  const saved = await prisma.savedJob.create({
    data: {
      userId,
      jobId,
    },
    include: {
      job: {
        include: {
          postedBy: { select: { id: true, name: true, username: true } },
        },
      },
    },
  });

  return saved;
}

/**
 * 2. Remove Saved Job
 */
async function removeSavedJob(userId, jobId) {
  const saved = await prisma.savedJob.findUnique({
    where: {
      userId_jobId: { userId, jobId },
    },
  });

  if (!saved) {
    throw new AppError(404, "Saved job not found");
  }

  await prisma.savedJob.delete({
    where: {
      userId_jobId: { userId, jobId },
    },
  });

  return { success: true };
}

/**
 * 3. List Saved Jobs
 */
async function listSavedJobs(userId, options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const [savedJobs, total] = await Promise.all([
    prisma.savedJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        job: {
          include: {
            postedBy: { select: { id: true, name: true, username: true, avatar: true } },
          },
        },
      },
    }),
    prisma.savedJob.count({ where: { userId } }),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    items: savedJobs.map((sj) => sj.job),
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

module.exports = {
  saveJob,
  removeSavedJob,
  listSavedJobs,
};
