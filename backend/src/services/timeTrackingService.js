const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { ensureProjectAccess } = require("./projectService");

const ACTIVE_STATUSES = ["RUNNING", "PAUSED"];

const parseDate = (value, field) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `Invalid ${field}`);
  }
  return date;
};

const resolveProjectTask = async (userId, projectId, taskId, allowMissingTask = true) => {
  const project = await ensureProjectAccess(userId, projectId);
  if (!taskId && allowMissingTask) {
    return { project, task: null };
  }

  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) {
    throw new AppError(400, "Task does not belong to the selected project");
  }
  return { project, task };
};

const includeRelations = {
  project: { select: { id: true, title: true } },
  task: { select: { id: true, title: true, projectId: true } },
};

const calculateSeconds = (entry, at = new Date()) => {
  const runningSeconds = entry.status === "RUNNING"
    ? Math.max(0, Math.floor((at.getTime() - entry.startedAt.getTime()) / 1000))
    : 0;
  return Math.max(0, entry.accumulatedSeconds + runningSeconds);
};

const serializeEntry = (entry) => ({
  ...entry,
  elapsedSeconds: entry.status === "RUNNING" ? calculateSeconds(entry) : entry.accumulatedSeconds,
});

const getActiveTimer = async (userId) => {
  const entry = await prisma.timeEntry.findFirst({
    where: { userId, status: { in: ACTIVE_STATUSES } },
    include: includeRelations,
    orderBy: { createdAt: "desc" },
  });
  return entry ? serializeEntry(entry) : null;
};

const startTimer = async (userId, data) => {
  const { task } = await resolveProjectTask(userId, data.projectId, data.taskId);
  const now = new Date();
  try {
    const entry = await prisma.$transaction(async (tx) => {
      const active = await tx.timeEntry.findFirst({ where: { userId, status: { in: ACTIVE_STATUSES } } });
      if (active) {
        throw new AppError(409, "An active timer already exists");
      }
      return tx.timeEntry.create({
        data: {
          userId,
          projectId: data.projectId,
          taskId: task?.id || null,
          description: data.description?.trim() || null,
          startedAt: now,
          status: "RUNNING",
          accumulatedSeconds: 0,
        },
        include: includeRelations,
      });
    }, { isolationLevel: "Serializable" });
    return serializeEntry(entry);
  } catch (error) {
    if (error instanceof AppError) { throw error; }
    if (error.code === "P2034") { throw new AppError(409, "An active timer already exists"); }
    throw error;
  }
};

const pauseTimer = async (userId) => {
  const active = await prisma.timeEntry.findFirst({ where: { userId, status: "RUNNING" } });
  if (!active) { throw new AppError(404, "No running timer found"); }
  const now = new Date();
  const accumulatedSeconds = calculateSeconds(active, now);
  const entry = await prisma.timeEntry.update({
    where: { id: active.id },
    data: { status: "PAUSED", pausedAt: now, accumulatedSeconds },
    include: includeRelations,
  });
  return serializeEntry(entry);
};

const resumeTimer = async (userId) => {
  const active = await prisma.timeEntry.findFirst({ where: { userId, status: "PAUSED" } });
  if (!active) { throw new AppError(404, "No paused timer found"); }
  const entry = await prisma.timeEntry.update({
    where: { id: active.id },
    data: { status: "RUNNING", startedAt: new Date(), pausedAt: null },
    include: includeRelations,
  });
  return serializeEntry(entry);
};

const stopTimer = async (userId, data = {}) => {
  const active = await prisma.timeEntry.findFirst({ where: { userId, status: { in: ACTIVE_STATUSES } } });
  if (!active) { throw new AppError(404, "No active timer found"); }
  const endedAt = new Date();
  const accumulatedSeconds = calculateSeconds(active, endedAt);
  const entry = await prisma.timeEntry.update({
    where: { id: active.id },
    data: {
      status: "COMPLETED",
      endedAt,
      pausedAt: null,
      accumulatedSeconds,
      durationMinutes: Math.round(accumulatedSeconds / 60),
      description: data.description !== undefined ? data.description?.trim() || null : active.description,
    },
    include: includeRelations,
  });
  return serializeEntry(entry);
};

const createTimeEntry = async (userId, data) => {
  const { task } = await resolveProjectTask(userId, data.projectId, data.taskId);
  const startedAt = parseDate(data.startedAt, "start time");
  const endedAt = parseDate(data.endedAt, "end time");
  const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
  if (durationSeconds < 0) { throw new AppError(400, "End time cannot be before start time"); }

  const entry = await prisma.timeEntry.create({
    data: {
      userId,
      projectId: data.projectId,
      taskId: task?.id || null,
      description: data.description?.trim() || null,
      startedAt,
      endedAt,
      accumulatedSeconds: durationSeconds,
      durationMinutes: Math.round(durationSeconds / 60),
      status: "COMPLETED",
    },
    include: includeRelations,
  });
  return serializeEntry(entry);
};

const listTimeEntries = async (userId, filters = {}) => {
  const where = { userId };
  if (filters.projectId) {
    await ensureProjectAccess(userId, filters.projectId);
    where.projectId = filters.projectId;
  }
  if (filters.taskId) { where.taskId = filters.taskId; }
  if (filters.from || filters.to) {
    where.startedAt = {};
    if (filters.from) { where.startedAt.gte = parseDate(filters.from, "from date"); }
    if (filters.to) { where.startedAt.lte = parseDate(filters.to, "to date"); }
  }
  const entries = await prisma.timeEntry.findMany({ where, include: includeRelations, orderBy: { startedAt: "desc" } });
  return entries.map(serializeEntry);
};

const updateTimeEntry = async (userId, entryId, data) => {
  const existing = await prisma.timeEntry.findFirst({ where: { id: entryId, userId } });
  if (!existing) { throw new AppError(404, "Time entry not found"); }
  if (ACTIVE_STATUSES.includes(existing.status)) { throw new AppError(409, "Stop the active timer before editing it"); }

  const projectId = data.projectId || existing.projectId;
  const taskId = data.taskId === undefined ? existing.taskId : data.taskId;
  const { task } = await resolveProjectTask(userId, projectId, taskId);
  const startedAt = data.startedAt === undefined ? existing.startedAt : parseDate(data.startedAt, "start time");
  const endedAt = data.endedAt === undefined ? existing.endedAt : parseDate(data.endedAt, "end time");
  if (!endedAt) { throw new AppError(400, "End time is required for a completed entry"); }
  const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
  if (durationSeconds < 0) { throw new AppError(400, "End time cannot be before start time"); }

  const entry = await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      projectId,
      taskId: task?.id || null,
      startedAt,
      endedAt,
      accumulatedSeconds: durationSeconds,
      durationMinutes: Math.round(durationSeconds / 60),
      description: data.description === undefined ? existing.description : data.description?.trim() || null,
    },
    include: includeRelations,
  });
  return serializeEntry(entry);
};

const deleteTimeEntry = async (userId, entryId) => {
  const entry = await prisma.timeEntry.findFirst({ where: { id: entryId, userId } });
  if (!entry) { throw new AppError(404, "Time entry not found"); }
  await prisma.timeEntry.delete({ where: { id: entryId } });
};

module.exports = {
  getActiveTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  createTimeEntry,
  listTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
};