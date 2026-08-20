const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { ensureProjectAccess } = require("./projectService");

const normalizeTaskStatus = (value) => {
  if (value === undefined || value === null) {return undefined;}
  const normalized = String(value).trim().toLowerCase();
  const map = {
    todo: "TODO",
    "in-progress": "IN_PROGRESS",
    review: "REVIEW",
    done: "DONE",
    completed: "DONE",
    blocked: "IN_PROGRESS",
  };
  return map[normalized];
};

const normalizeTaskPriority = (value) => {
  if (value === undefined || value === null) {return undefined;}
  const priority = String(value).trim().toUpperCase();
  return ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority) ? priority : undefined;
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

const createTaskActivity = async (taskId, userId, type, detail, metadata = null) => {
  return prisma.taskActivity.create({
    data: {
      taskId,
      userId,
      type,
      detail,
      metadata,
    },
  });
};

const createTask = async (userId, projectId, data) => {
  await ensureProjectAccess(userId, projectId);

  const title = data.title?.trim();
  const description = data.description?.trim() || null;
  const status = data.status !== undefined ? normalizeTaskStatus(data.status) : "TODO";
  const priority = data.priority !== undefined ? normalizeTaskPriority(data.priority) : "MEDIUM";
  const startDate = parseDateValue(data.startDate);
  const deadline = parseDateValue(data.deadline);

  if (!title) {
    throw new AppError(400, "Task title is required");
  }

  if (!status) {
    throw new AppError(400, 'Task status must be one of: todo, in-progress, review, done, completed, blocked');
  }

  if (!priority) {
    throw new AppError(400, 'Task priority must be one of: low, medium, high, urgent');
  }

  if (startDate !== undefined && startDate !== null && Number.isNaN(startDate.getTime())) {
    throw new AppError(400, 'Invalid start date');
  }

  if (deadline !== undefined && deadline !== null && Number.isNaN(deadline.getTime())) {
    throw new AppError(400, 'Invalid deadline');
  }

  if (data.assigneeId) {
    const membership = await prisma.projectMember.findFirst({
      where: { projectId, userId: data.assigneeId },
    });
    if (!membership) {
      throw new AppError(400, "Assignee must be a project member");
    }
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      description,
      status,
      priority,
      startDate,
      deadline,
      completedAt: status === 'DONE' ? new Date() : null,
      assignedTo: data.assigneeId || null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  await createTaskActivity(task.id, userId, "task_created", `Task created: ${task.title}`);
  return task;
};

const listTasksForProject = async (userId, projectId) => {
  await ensureProjectAccess(userId, projectId);
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      subtasks: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return tasks.map((task) => {
    const totalSubtasks = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter((subtask) => subtask.status === "completed").length || 0;
    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : task.status === "DONE" ? 100 : 0;

    return {
      ...task,
      progress,
      totalSubtasks,
      completedSubtasks,
    };
  });
};

const updateTask = async (userId, projectId, taskId, data) => {
  await ensureProjectAccess(userId, projectId);

  const existingTask = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!existingTask) {
    throw new AppError(404, "Task not found");
  }

  const payload = {};
  if (data.title !== undefined) {payload.title = data.title.trim();}
  if (data.description !== undefined) {payload.description = data.description?.trim() || null;}
  if (data.status !== undefined) {
    const status = normalizeTaskStatus(data.status);
    if (!status) {
      throw new AppError(400, "Task status must be one of: todo, in-progress, review, done, completed, blocked");
    }
    payload.status = status;
  }
  if (data.priority !== undefined) {
    const priority = normalizeTaskPriority(data.priority);
    if (!priority) {
      throw new AppError(400, "Task priority must be one of: low, medium, high, urgent");
    }
    payload.priority = priority;
  }
  if (data.startDate !== undefined) {payload.startDate = parseDateValue(data.startDate);}
  if (data.deadline !== undefined) {payload.deadline = parseDateValue(data.deadline);}
  if (data.assigneeId !== undefined) {payload.assignedTo = data.assigneeId || null;}

  if (payload.assignedTo) {
    const membership = await prisma.projectMember.findFirst({
      where: { projectId, userId: payload.assignedTo },
    });
    if (!membership) {
      throw new AppError(400, "Assignee must be a project member");
    }
  }

  if (payload.startDate !== undefined && payload.startDate !== null && Number.isNaN(payload.startDate.getTime())) {
    throw new AppError(400, "Invalid start date");
  }

  if (payload.deadline !== undefined && payload.deadline !== null && Number.isNaN(payload.deadline.getTime())) {
    throw new AppError(400, "Invalid deadline");
  }

  if (payload.status !== undefined) {
    payload.completedAt = payload.status === "DONE" ? new Date() : null;
  }

  if (Object.keys(payload).length === 0) {
    throw new AppError(400, "At least one task field must be provided for update");
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: payload,
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  await createTaskActivity(task.id, userId, "task_updated", `Task updated: ${task.title}`);
  return task;
};

const deleteTask = async (userId, projectId, taskId) => {
  await ensureProjectAccess(userId, projectId);

  const existingTask = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!existingTask) {
    throw new AppError(404, "Task not found");
  }

  await createTaskActivity(taskId, userId, "task_deleted", `Task deleted: ${existingTask.title}`);
  await prisma.task.delete({ where: { id: taskId } });
  return true;
};

const getTask = async (userId, projectId, taskId) => {
  await ensureProjectAccess(userId, projectId);

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      comments: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } },
      attachments: { include: { user: { select: { id: true, name: true, email: true } } } },
      subtasks: { include: { assignee: { select: { id: true, name: true, email: true } } } },
      timeEntries: { include: { user: { select: { id: true, name: true, email: true } } } },
      activities: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!task) {
    throw new AppError(404, "Task not found");
  }

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((subtask) => subtask.status === "completed").length || 0;
  const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : task.status === "DONE" ? 100 : 0;

  return { ...task, progress, totalSubtasks, completedSubtasks };
};

const createTaskComment = async (userId, projectId, taskId, content) => {
  await ensureProjectAccess(userId, projectId);

  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) {
    throw new AppError(404, "Task not found");
  }

  const comment = await prisma.taskComment.create({
    data: {
      taskId,
      userId,
      message: String(content).trim(),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await createTaskActivity(taskId, userId, "comment_added", `Comment added: ${comment.message}`);
  return comment;
};

const listTaskComments = async (userId, projectId, taskId) => {
  await ensureProjectAccess(userId, projectId);
  return prisma.taskComment.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
};

const createTaskAttachment = async (userId, projectId, taskId, file, uploadResult) => {
  await ensureProjectAccess(userId, projectId);

  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) {
    throw new AppError(404, "Task not found");
  }

  const attachment = await prisma.taskAttachment.create({
    data: {
      taskId,
      userId,
      url: uploadResult.url,
      provider: uploadResult.provider,
      fileName: sanitizeFileName(file.originalname),
      fileType: file.mimetype,
      fileSize: file.size || (file.buffer ? file.buffer.length : null),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await createTaskActivity(taskId, userId, "attachment_added", `Attachment uploaded: ${file.originalname}`);
  return attachment;
};

const listTaskAttachments = async (userId, projectId, taskId) => {
  await ensureProjectAccess(userId, projectId);
  return prisma.taskAttachment.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
};

const createSubtask = async (userId, projectId, taskId, data) => {
  await ensureProjectAccess(userId, projectId);

  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) {
    throw new AppError(404, "Task not found");
  }

  const title = String(data.title).trim();
  const status = String(data.status || "todo").trim();
  const dueDate = data.dueDate ? new Date(data.dueDate) : null;

  if (!title) {
    throw new AppError(400, "Subtask title is required");
  }

  if (!["todo", "in-progress", "completed", "blocked"].includes(status)) {
    throw new AppError(400, "Subtask status must be one of: todo, in-progress, completed, blocked");
  }

  if (dueDate !== null && Number.isNaN(dueDate.getTime())) {
    throw new AppError(400, "Invalid due date");
  }

  if (data.assigneeId) {
    const membership = await prisma.projectMember.findFirst({ where: { projectId, userId: data.assigneeId } });
    if (!membership) {
      throw new AppError(400, "Assignee must be a project member");
    }
  }

  const subtask = await prisma.subtask.create({
    data: {
      taskId,
      title,
      status,
      dueDate,
      assigneeId: data.assigneeId || null,
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  await createTaskActivity(taskId, userId, "subtask_created", `Subtask created: ${subtask.title}`);
  return subtask;
};

const listSubtasks = async (userId, projectId, taskId) => {
  await ensureProjectAccess(userId, projectId);
  return prisma.subtask.findMany({
    where: { taskId },
    include: { assignee: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
};

const updateSubtask = async (userId, projectId, taskId, subtaskId, data) => {
  await ensureProjectAccess(userId, projectId);

  const existingSubtask = await prisma.subtask.findFirst({ where: { id: subtaskId, taskId } });
  if (!existingSubtask) {
    throw new AppError(404, "Subtask not found");
  }

  const payload = {};
  if (data.title !== undefined) {payload.title = String(data.title).trim();}
  if (data.status !== undefined) {payload.status = String(data.status).trim();}
  if (data.dueDate !== undefined) {payload.dueDate = data.dueDate ? new Date(data.dueDate) : null;}
  if (data.assigneeId !== undefined) {payload.assigneeId = data.assigneeId || null;}

  if (payload.status !== undefined && !["todo", "in-progress", "completed", "blocked"].includes(payload.status)) {
    throw new AppError(400, "Subtask status must be one of: todo, in-progress, completed, blocked");
  }

  if (payload.dueDate !== undefined && payload.dueDate !== null && Number.isNaN(payload.dueDate.getTime())) {
    throw new AppError(400, "Invalid due date");
  }

  if (payload.assigneeId) {
    const membership = await prisma.projectMember.findFirst({ where: { projectId, userId: payload.assigneeId } });
    if (!membership) {
      throw new AppError(400, "Assignee must be a project member");
    }
  }

  if (Object.keys(payload).length === 0) {
    throw new AppError(400, "At least one subtask field must be provided for update");
  }

  const subtask = await prisma.subtask.update({
    where: { id: subtaskId },
    data: payload,
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  await createTaskActivity(taskId, userId, "subtask_updated", `Subtask updated: ${subtask.title}`);
  return subtask;
};

const deleteSubtask = async (userId, projectId, taskId, subtaskId) => {
  await ensureProjectAccess(userId, projectId);

  const existingSubtask = await prisma.subtask.findFirst({ where: { id: subtaskId, taskId } });
  if (!existingSubtask) {
    throw new AppError(404, "Subtask not found");
  }

  await createTaskActivity(taskId, userId, "subtask_deleted", `Subtask deleted: ${existingSubtask.title}`);
  await prisma.subtask.delete({ where: { id: subtaskId } });
  return true;
};

const createTimeEntry = async (userId, projectId, taskId, data) => {
  await ensureProjectAccess(userId, projectId);

  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) {
    throw new AppError(404, "Task not found");
  }

  const startedAt = new Date(data.startedAt);
  const endedAt = data.endedAt ? new Date(data.endedAt) : null;

  if (Number.isNaN(startedAt.getTime())) {
    throw new AppError(400, "Invalid start time");
  }

  if (endedAt !== null && Number.isNaN(endedAt.getTime())) {
    throw new AppError(400, "Invalid end time");
  }

  if (endedAt !== null && endedAt < startedAt) {
    throw new AppError(400, "End time cannot be before start time");
  }

  const durationMinutes = endedAt ? Math.round((endedAt - startedAt) / 60000) : null;

  const entry = await prisma.timeEntry.create({
    data: {
      projectId,
      taskId,
      userId,
      description: data.description?.trim() || null,
      startedAt,
      endedAt,
      durationMinutes,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await createTaskActivity(taskId, userId, "time_entry_created", `Time entry created`, { durationMinutes });
  return entry;
};

const listTimeEntries = async (userId, projectId, taskId) => {
  await ensureProjectAccess(userId, projectId);
  return prisma.timeEntry.findMany({
    where: { taskId, userId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
};

const updateTimeEntry = async (userId, projectId, taskId, entryId, data) => {
  await ensureProjectAccess(userId, projectId);

  const existingEntry = await prisma.timeEntry.findFirst({ where: { id: entryId, taskId, userId } });
  if (!existingEntry) {
    throw new AppError(404, "Time entry not found");
  }

  const payload = {};
  if (data.description !== undefined) {payload.description = String(data.description).trim() || null;}
  if (data.startedAt !== undefined) {
    const startedAt = new Date(data.startedAt);
    if (Number.isNaN(startedAt.getTime())) {
      throw new AppError(400, "Invalid start time");
    }
    payload.startedAt = startedAt;
  }
  if (data.endedAt !== undefined) {
    const endedAt = data.endedAt ? new Date(data.endedAt) : null;
    if (endedAt !== null && Number.isNaN(endedAt.getTime())) {
      throw new AppError(400, "Invalid end time");
    }
    payload.endedAt = endedAt;
  }

  if (payload.startedAt !== undefined || payload.endedAt !== undefined) {
    const startedAt = payload.startedAt ?? existingEntry.startedAt;
    const endedAt = payload.endedAt !== undefined ? payload.endedAt : existingEntry.endedAt;
    if (endedAt !== null && endedAt < startedAt) {
      throw new AppError(400, "End time cannot be before start time");
    }
    payload.durationMinutes = endedAt ? Math.round((endedAt - startedAt) / 60000) : null;
  }

  if (Object.keys(payload).length === 0) {
    throw new AppError(400, "At least one time entry field must be provided for update");
  }

  const entry = await prisma.timeEntry.update({
    where: { id: entryId },
    data: payload,
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await createTaskActivity(taskId, userId, "time_entry_updated", `Time entry updated`, { durationMinutes: entry.durationMinutes });
  return entry;
};

const listTaskActivity = async (userId, projectId, taskId) => {
  await ensureProjectAccess(userId, projectId);
  return prisma.taskActivity.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
};

module.exports = {
  createTask,
  listTasksForProject,
  getTask,
  updateTask,
  deleteTask,
  createTaskComment,
  listTaskComments,
  createTaskAttachment,
  listTaskAttachments,
  createSubtask,
  listSubtasks,
  updateSubtask,
  deleteSubtask,
  createTimeEntry,
  listTimeEntries,
  updateTimeEntry,
  listTaskActivity,
};
