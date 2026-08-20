const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

const updateUserProfile = async (userId, data) => {
  const { name, username, bio, avatar, coverImage, skills, socialLinks, experience, education, portfolioLinks, visibility } = data;
  const normalizedUsername = username?.trim().toLowerCase();

  if (normalizedUsername) {
    const userWithName = await prisma.user.findFirst({
      where: { username: normalizedUsername, NOT: { id: userId } },
    });

    if (userWithName) {
      throw new AppError(400, "That username is already taken");
    }
  }

  const payload = {};
  if (name !== undefined) {payload.name = name.trim();}
  if (normalizedUsername !== undefined) {payload.username = normalizedUsername;}
  if (bio !== undefined) {payload.bio = bio.trim();}
  if (avatar !== undefined) {payload.avatar = avatar;}
  if (coverImage !== undefined) {payload.coverImage = coverImage;}
  if (Array.isArray(skills)) {payload.skills = skills.map((skill) => String(skill).trim()).filter(Boolean);}
  if (socialLinks !== undefined) {payload.socialLinks = socialLinks;}
  if (experience !== undefined) {payload.experience = experience;}
  if (education !== undefined) {payload.education = education;}
  if (Array.isArray(portfolioLinks)) {payload.portfolioLinks = portfolioLinks.map((link) => String(link).trim()).filter(Boolean);}
  if (visibility !== undefined) {payload.visibility = visibility;}

  if (Object.keys(payload).length === 0) {
    throw new AppError(400, "At least one profile field must be provided");
  }

  return prisma.user.update({
    where: { id: userId },
    data: payload,
  });
};

const followUser = async (followerId, followingId) => {
  const follow = await prisma.userFollow.create({
    data: { followerId, followingId },
  });

  const notificationService = require("./notificationService");
  const follower = await prisma.user.findUnique({ where: { id: followerId }, select: { username: true } });

  await notificationService.createNotification({
    recipientId: followingId,
    senderId: followerId,
    type: "FOLLOW",
    title: "New Follower",
    message: `${follower?.username || "Someone"} started following you`,
    referenceId: follow.id,
    referenceType: "USER_FOLLOW",
  }).catch(() => null);

  return follow;
};

const applyToJob = async (userId, jobId, resumeUrl = "") => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { postedById: true, title: true },
  });
  if (!job) {throw new AppError(404, "Job not found");}

  const app = await prisma.jobApplication.create({
    data: { jobId, userId, resumeUrl },
  });

  const applicant = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  const notificationService = require("./notificationService");

  await notificationService.createNotification({
    recipientId: job.postedById,
    senderId: userId,
    type: "JOB_APPLICATION",
    title: "New Job Application",
    message: `${applicant?.username || "Someone"} applied for your job post ${job.title}`,
    referenceId: app.id,
    referenceType: "JOB_APPLICATION",
  }).catch(() => null);

  return app;
};

module.exports = {
  updateUserProfile,
  followUser,
  applyToJob,
};
