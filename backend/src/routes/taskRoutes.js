const express = require("express");
const router = express.Router({ mergeParams: true });

const {
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
} = require("../controllers/taskController");
const { upload } = require("../controllers/uploadController");
const authenticate = require("../middlewares/auth");
const validateRequest = require("../middlewares/validateRequest");
const { uploadLimiter } = require("../middlewares/rateLimiter");
const {
  createTaskValidationRules,
  updateTaskValidationRules,
  createCommentValidationRules,
  createSubtaskValidationRules,
  updateSubtaskValidationRules,
  createTimeEntryValidationRules,
  updateTimeEntryValidationRules,
} = require("../validators/taskValidators");

router.post("/:projectId/tasks", authenticate, ...createTaskValidationRules, validateRequest, create);
router.get("/:projectId/tasks", authenticate, list);
router.get("/:projectId/tasks/:taskId", authenticate, get);
router.put("/:projectId/tasks/:taskId", authenticate, ...updateTaskValidationRules, validateRequest, update);
router.delete("/:projectId/tasks/:taskId", authenticate, remove);

router.post(
  "/:projectId/tasks/:taskId/comments",
  authenticate,
  ...createCommentValidationRules,
  validateRequest,
  addComment,
);
router.get("/:projectId/tasks/:taskId/comments", authenticate, listComments);

router.post("/:projectId/tasks/:taskId/attachments", authenticate, uploadLimiter, upload.single("file"), addAttachment);
router.get("/:projectId/tasks/:taskId/attachments", authenticate, listAttachments);

router.post(
  "/:projectId/tasks/:taskId/subtasks",
  authenticate,
  ...createSubtaskValidationRules,
  validateRequest,
  addSubtask,
);
router.get("/:projectId/tasks/:taskId/subtasks", authenticate, listSubtaskItems);
router.put(
  "/:projectId/tasks/:taskId/subtasks/:subtaskId",
  authenticate,
  ...updateSubtaskValidationRules,
  validateRequest,
  updateSubtaskItem,
);
router.delete("/:projectId/tasks/:taskId/subtasks/:subtaskId", authenticate, deleteSubtaskItem);

router.post(
  "/:projectId/tasks/:taskId/time-entries",
  authenticate,
  ...createTimeEntryValidationRules,
  validateRequest,
  addTimeEntry,
);
router.get("/:projectId/tasks/:taskId/time-entries", authenticate, listTimeEntryItems);
router.put(
  "/:projectId/tasks/:taskId/time-entries/:entryId",
  authenticate,
  ...updateTimeEntryValidationRules,
  validateRequest,
  updateTimeEntryItem,
);

router.get("/:projectId/tasks/:taskId/activity", authenticate, listActivity);

module.exports = router;
