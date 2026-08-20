const {
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
} = require("../services/taskService");

const create = async (req, res, next) => {
  try {
    const task = await createTask(req.user.id, req.params.projectId, req.body);
    return res.status(201).json({ success: true, message: "Task created successfully", task });
  } catch (error) {
    return next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const tasks = await listTasksForProject(req.user.id, req.params.projectId);
    return res.status(200).json({ success: true, tasks });
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const task = await updateTask(req.user.id, req.params.projectId, req.params.taskId, req.body);
    return res.status(200).json({ success: true, message: "Task updated successfully", task });
  } catch (error) {
    return next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteTask(req.user.id, req.params.projectId, req.params.taskId);
    return res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const get = async (req, res, next) => {
  try {
    const task = await getTask(req.user.id, req.params.projectId, req.params.taskId);
    return res.status(200).json({ success: true, task });
  } catch (error) {
    return next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const comment = await createTaskComment(req.user.id, req.params.projectId, req.params.taskId, req.body.content);
    return res.status(201).json({ success: true, message: "Comment added successfully", comment });
  } catch (error) {
    return next(error);
  }
};

const listComments = async (req, res, next) => {
  try {
    const comments = await listTaskComments(req.user.id, req.params.projectId, req.params.taskId);
    return res.status(200).json({ success: true, comments });
  } catch (error) {
    return next(error);
  }
};

const addAttachment = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }
    const uploadResult = await require("../services/uploadService").uploadToStorage(file, "task_attachments");
    const attachment = await createTaskAttachment(req.user.id, req.params.projectId, req.params.taskId, file, uploadResult);
    return res.status(201).json({ success: true, message: "Attachment uploaded successfully", attachment });
  } catch (error) {
    return next(error);
  }
};

const listAttachments = async (req, res, next) => {
  try {
    const attachments = await listTaskAttachments(req.user.id, req.params.projectId, req.params.taskId);
    return res.status(200).json({ success: true, attachments });
  } catch (error) {
    return next(error);
  }
};

const addSubtask = async (req, res, next) => {
  try {
    const subtask = await createSubtask(req.user.id, req.params.projectId, req.params.taskId, req.body);
    return res.status(201).json({ success: true, message: "Subtask created successfully", subtask });
  } catch (error) {
    return next(error);
  }
};

const listSubtaskItems = async (req, res, next) => {
  try {
    const subtasks = await listSubtasks(req.user.id, req.params.projectId, req.params.taskId);
    return res.status(200).json({ success: true, subtasks });
  } catch (error) {
    return next(error);
  }
};

const updateSubtaskItem = async (req, res, next) => {
  try {
    const subtask = await updateSubtask(req.user.id, req.params.projectId, req.params.taskId, req.params.subtaskId, req.body);
    return res.status(200).json({ success: true, message: "Subtask updated successfully", subtask });
  } catch (error) {
    return next(error);
  }
};

const deleteSubtaskItem = async (req, res, next) => {
  try {
    await deleteSubtask(req.user.id, req.params.projectId, req.params.taskId, req.params.subtaskId);
    return res.status(200).json({ success: true, message: "Subtask deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const addTimeEntry = async (req, res, next) => {
  try {
    const entry = await createTimeEntry(req.user.id, req.params.projectId, req.params.taskId, req.body);
    return res.status(201).json({ success: true, message: "Time entry created successfully", entry });
  } catch (error) {
    return next(error);
  }
};

const listTimeEntryItems = async (req, res, next) => {
  try {
    const entries = await listTimeEntries(req.user.id, req.params.projectId, req.params.taskId);
    return res.status(200).json({ success: true, entries });
  } catch (error) {
    return next(error);
  }
};

const updateTimeEntryItem = async (req, res, next) => {
  try {
    const entry = await updateTimeEntry(req.user.id, req.params.projectId, req.params.taskId, req.params.entryId, req.body);
    return res.status(200).json({ success: true, message: "Time entry updated successfully", entry });
  } catch (error) {
    return next(error);
  }
};

const listActivity = async (req, res, next) => {
  try {
    const activity = await listTaskActivity(req.user.id, req.params.projectId, req.params.taskId);
    return res.status(200).json({ success: true, activity });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  create,
  list,
  get,
  update,
  remove,
  addComment,
  listComments,
  addAttachment,
  listAttachments,
  addSubtask,
  listSubtaskItems,
  updateSubtaskItem,
  deleteSubtaskItem,
  addTimeEntry,
  listTimeEntryItems,
  updateTimeEntryItem,
  listActivity,
};
