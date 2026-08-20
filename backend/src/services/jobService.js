const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * 1. Create Job
 */
async function createJob(userId, data) {
  const {
    title,
    description,
    company,
    location,
    employmentType,
    experienceLevel,
    salaryMin,
    salaryMax,
    skills,
    category,
    expiresAt,
  } = data;

  if (!title || !title.trim()) {throw new AppError(400, "Job title is required");}
  if (!company || !company.trim()) {throw new AppError(400, "Company name is required");}

  // Validate salary range
  const minVal = salaryMin !== undefined && salaryMin !== null ? parseInt(salaryMin, 10) : null;
  const maxVal = salaryMax !== undefined && salaryMax !== null ? parseInt(salaryMax, 10) : null;
  if (minVal !== null && maxVal !== null && minVal > maxVal) {
    throw new AppError(400, "Minimum salary cannot be greater than maximum salary");
  }

  const job = await prisma.job.create({
    data: {
      title: title.trim(),
      description: description ? description.trim() : null,
      company: company.trim(),
      location: location ? location.trim() : null,
      employmentType: employmentType || null,
      experienceLevel: experienceLevel || null,
      salaryMin: minVal,
      salaryMax: maxVal,
      skills: Array.isArray(skills) ? skills.map((s) => s.trim()).filter(Boolean) : [],
      category: category || null,
      status: "OPEN",
      postedById: userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: {
      postedBy: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });

  return job;
}

/**
 * 2. Update Job
 */
async function updateJob(userId, jobId, data, userRole) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {throw new AppError(404, "Job not found");}

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  if (job.postedById !== userId && !isAdmin) {
    throw new AppError(403, "Access denied to update this job");
  }

  const payload = {};
  if (data.title !== undefined) {payload.title = data.title.trim();}
  if (data.description !== undefined) {payload.description = data.description ? data.description.trim() : null;}
  if (data.company !== undefined) {payload.company = data.company.trim();}
  if (data.location !== undefined) {payload.location = data.location ? data.location.trim() : null;}
  if (data.employmentType !== undefined) {payload.employmentType = data.employmentType || null;}
  if (data.experienceLevel !== undefined) {payload.experienceLevel = data.experienceLevel || null;}
  if (data.category !== undefined) {payload.category = data.category || null;}
  if (data.status !== undefined) {
    if (!["OPEN", "CLOSED"].includes(data.status)) {
      throw new AppError(400, "Status must be OPEN or CLOSED");
    }
    payload.status = data.status;
  }

  if (data.salaryMin !== undefined) {payload.salaryMin = data.salaryMin !== null ? parseInt(data.salaryMin, 10) : null;}
  if (data.salaryMax !== undefined) {payload.salaryMax = data.salaryMax !== null ? parseInt(data.salaryMax, 10) : null;}

  // Validate salary range if updated
  const minVal = payload.salaryMin !== undefined ? payload.salaryMin : job.salaryMin;
  const maxVal = payload.salaryMax !== undefined ? payload.salaryMax : job.salaryMax;
  if (minVal !== null && maxVal !== null && minVal > maxVal) {
    throw new AppError(400, "Minimum salary cannot be greater than maximum salary");
  }

  if (data.skills !== undefined) {
    payload.skills = Array.isArray(data.skills) ? data.skills.map((s) => s.trim()).filter(Boolean) : [];
  }

  if (data.expiresAt !== undefined) {
    payload.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: payload,
    include: {
      postedBy: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });

  return updatedJob;
}

/**
 * 3. Delete Job
 */
async function deleteJob(userId, jobId, userRole) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {throw new AppError(404, "Job not found");}

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  if (job.postedById !== userId && !isAdmin) {
    throw new AppError(403, "Access denied to delete this job");
  }

  await prisma.job.delete({ where: { id: jobId } });
  return { success: true };
}

/**
 * 4. Get Single Job
 */
async function getJob(jobId) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      postedBy: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });
  if (!job) {throw new AppError(404, "Job not found");}
  return job;
}

/**
 * 5. List & Search Jobs
 */
async function listJobs(options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = { status: options.status || "OPEN" };

  // Text search filters
  if (options.keyword) {
    where.OR = [
      { title: { contains: options.keyword, mode: "insensitive" } },
      { description: { contains: options.keyword, mode: "insensitive" } },
      { company: { contains: options.keyword, mode: "insensitive" } },
    ];
  }

  if (options.location) {
    where.location = { contains: options.location, mode: "insensitive" };
  }

  if (options.company) {
    where.company = { contains: options.company, mode: "insensitive" };
  }

  if (options.category) {
    where.category = { contains: options.category, mode: "insensitive" };
  }

  // Exact match filters
  if (options.employmentType) {
    where.employmentType = options.employmentType;
  }

  if (options.experienceLevel) {
    where.experienceLevel = options.experienceLevel;
  }

  if (options.status) {
    where.status = options.status;
  }

  // Salary range filters
  if (options.salaryMin) {
    where.salaryMax = { gte: parseInt(options.salaryMin, 10) };
  }

  if (options.salaryMax) {
    where.salaryMin = { lte: parseInt(options.salaryMax, 10) };
  }

  // Skills filter (array helper)
  if (options.skills) {
    const skillsList = Array.isArray(options.skills)
      ? options.skills
      : options.skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (skillsList.length > 0) {
      where.skills = { hasSome: skillsList };
    }
  }

  // Sort orders
  let orderBy = { createdAt: "desc" };
  if (options.sort === "salary") {
    orderBy = { salaryMax: "desc" };
  } else if (options.sort === "oldest") {
    orderBy = { createdAt: "asc" };
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        postedBy: { select: { id: true, name: true, username: true, avatar: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    items: jobs,
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

module.exports = {
  createJob,
  updateJob,
  deleteJob,
  getJob,
  listJobs,
};
