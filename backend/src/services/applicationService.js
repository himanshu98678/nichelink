const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const notificationService = require("./notificationService");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * 1. Apply for Job
 */
async function applyJob(userId, jobId, { resumeUrl, coverLetter }) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {throw new AppError(404, "Job not found");}

  if (job.status === "CLOSED") {
    throw new AppError(400, "Cannot apply to a closed job");
  }

  if (job.expiresAt && new Date(job.expiresAt) < new Date()) {
    throw new AppError(400, "Job posting has expired");
  }

  if (job.postedById === userId) {
    throw new AppError(400, "You cannot apply to your own job listing");
  }

  const existing = await prisma.jobApplication.findUnique({
    where: {
      jobId_userId: { jobId, userId },
    },
  });

  if (existing) {
    throw new AppError(400, "You have already applied to this job");
  }

  const application = await prisma.jobApplication.create({
    data: {
      jobId,
      userId,
      resumeUrl: resumeUrl || null,
      coverLetter: coverLetter ? coverLetter.trim() : null,
      status: "PENDING",
    },
    include: {
      job: true,
      user: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });

  // Notify employer
  const applicant = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  await notificationService.createNotification({
    recipientId: job.postedById,
    senderId: userId,
    type: "JOB_APPLICATION",
    title: "New Job Application",
    message: `${applicant?.username || "Someone"} applied for your job post: ${job.title}`,
    referenceId: application.id,
    referenceType: "JOB_APPLICATION",
  }).catch(() => null);

  return application;
}

/**
 * 2. Withdraw Application
 */
async function withdrawApplication(userId, jobId) {
  const application = await prisma.jobApplication.findUnique({
    where: {
      jobId_userId: { jobId, userId },
    },
  });

  if (!application) {
    throw new AppError(404, "Job application not found");
  }

  await prisma.jobApplication.delete({
    where: {
      jobId_userId: { jobId, userId },
    },
  });

  return { success: true };
}

/**
 * 3. List Applications (Candidate or Employer view)
 */
async function listApplications(userId, options = {}, userRole) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = {};
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  if (options.jobId) {
    // Employer view filtering by jobId
    const job = await prisma.job.findUnique({ where: { id: options.jobId } });
    if (!job) {throw new AppError(404, "Job not found");}

    if (job.postedById !== userId && !isAdmin) {
      throw new AppError(403, "Access denied to view applications for this job");
    }

    where.jobId = options.jobId;
  } else {
    // Candidate view listing own applications
    where.userId = userId;
  }

  if (options.status) {
    where.status = options.status;
  }

  const [applications, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy: { appliedAt: "desc" },
      skip,
      take: limit,
      include: {
        job: {
          include: {
            postedBy: { select: { id: true, name: true, username: true } },
          },
        },
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
    }),
    prisma.jobApplication.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    items: applications,
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * 4. Application Details
 */
async function getApplicationDetails(userId, applicationId, userRole) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
      user: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const isOwner = application.job.postedById === userId;
  const isApplicant = application.userId === userId;

  if (!isOwner && !isApplicant && !isAdmin) {
    throw new AppError(403, "Access denied to application details");
  }

  return application;
}

/**
 * 5. Update Application Status
 */
async function updateApplicationStatus(employerId, applicationId, status, userRole) {
  const allowedStatuses = ["PENDING", "REVIEWED", "SHORTLISTED", "REJECTED", "ACCEPTED"];
  if (!allowedStatuses.includes(status)) {
    throw new AppError(400, "Invalid application status value");
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  if (application.job.postedById !== employerId && !isAdmin) {
    throw new AppError(403, "Access denied to update application status");
  }

  const allowedTransitions = {
    PENDING: ["REVIEWED", "SHORTLISTED", "REJECTED", "ACCEPTED"],
    REVIEWED: ["SHORTLISTED", "REJECTED", "ACCEPTED"],
    SHORTLISTED: ["REJECTED", "ACCEPTED"],
    ACCEPTED: [],
    REJECTED: [],
  };

  if (status !== application.status && !allowedTransitions[application.status].includes(status)) {
    throw new AppError(400, "Invalid application status transition");
  }

  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
    include: {
      job: true,
      user: { select: { id: true, name: true, username: true } },
    },
  });

  // Notify candidate
  let title = "Job Application Update";
  let msg = `Your application for the position of ${application.job.title} has been updated to ${status}.`;

  if (status === "ACCEPTED") {
    title = "Congratulations! Job Application Accepted";
    msg = `Your application for the position of ${application.job.title} at ${application.job.company} was accepted!`;
  } else if (status === "REJECTED") {
    title = "Job Application Update";
    msg = `We regret to inform you that your application for ${application.job.title} was rejected.`;
  }

  await notificationService.createNotification({
    recipientId: application.userId,
    senderId: employerId,
    type: "SYSTEM",
    title,
    message: msg,
    referenceId: applicationId,
    referenceType: "JOB_APPLICATION",
  }).catch(() => null);

  return updated;
}

module.exports = {
  applyJob,
  withdrawApplication,
  listApplications,
  getApplicationDetails,
  updateApplicationStatus,
};
