const { body } = require("express-validator");

const createTaskValidationRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ max: 150 })
    .withMessage("Task title must be 150 characters or fewer"),
  body("status")
    .optional({ nullable: true })
    .trim()
    .isIn(["todo", "in-progress", "review", "done", "completed", "blocked"])
    .withMessage("Status must be one of: todo, in-progress, review, done, completed, blocked"),
  body("priority")
    .optional({ nullable: true })
    .trim()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be one of: low, medium, high, urgent"),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be 1000 characters or fewer"),
  body("labels")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Labels must be an array of strings"),
  body("labels.*")
    .optional({ nullable: true })
    .trim()
    .isString()
    .withMessage("Each label must be a string"),
];

const updateTaskValidationRules = [
  body("title")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Task title must be 150 characters or fewer"),
  body("status")
    .optional({ nullable: true })
    .trim()
    .isIn(["todo", "in-progress", "review", "done", "completed", "blocked"])
    .withMessage("Status must be one of: todo, in-progress, review, done, completed, blocked"),
  body("priority")
    .optional({ nullable: true })
    .trim()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be one of: low, medium, high, urgent"),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be 1000 characters or fewer"),
  body("labels")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Labels must be an array of strings"),
  body("labels.*")
    .optional({ nullable: true })
    .trim()
    .isString()
    .withMessage("Each label must be a string"),
];

const createCommentValidationRules = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment content is required")
    .isLength({ max: 1000 })
    .withMessage("Comment must be 1000 characters or fewer"),
];

const createSubtaskValidationRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Subtask title is required")
    .isLength({ max: 150 })
    .withMessage("Subtask title must be 150 characters or fewer"),
  body("status")
    .optional({ nullable: true })
    .trim()
    .isIn(["todo", "in-progress", "completed", "blocked"])
    .withMessage("Subtask status must be one of: todo, in-progress, completed, blocked"),
  body("dueDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Due date must be a valid ISO 8601 date"),
  body("assigneeId")
    .optional({ nullable: true })
    .trim()
    .notEmpty()
    .withMessage("Assignee ID must be a valid string"),
];

const updateSubtaskValidationRules = [
  body("title")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Subtask title must be 150 characters or fewer"),
  body("status")
    .optional({ nullable: true })
    .trim()
    .isIn(["todo", "in-progress", "completed", "blocked"])
    .withMessage("Subtask status must be one of: todo, in-progress, completed, blocked"),
  body("dueDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Due date must be a valid ISO 8601 date"),
  body("assigneeId")
    .optional({ nullable: true })
    .trim()
    .notEmpty()
    .withMessage("Assignee ID must be a valid string"),
];

const createTimeEntryValidationRules = [
  body("startedAt")
    .trim()
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601()
    .withMessage("Start time must be a valid ISO 8601 date"),
  body("endedAt")
    .optional({ nullable: true })
    .trim()
    .isISO8601()
    .withMessage("End time must be a valid ISO 8601 date"),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be 1000 characters or fewer"),
];

const updateTimeEntryValidationRules = [
  body("startedAt")
    .optional({ nullable: true })
    .trim()
    .isISO8601()
    .withMessage("Start time must be a valid ISO 8601 date"),
  body("endedAt")
    .optional({ nullable: true })
    .trim()
    .isISO8601()
    .withMessage("End time must be a valid ISO 8601 date"),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be 1000 characters or fewer"),
];

module.exports = {
  createTaskValidationRules,
  updateTaskValidationRules,
  createCommentValidationRules,
  createSubtaskValidationRules,
  updateSubtaskValidationRules,
  createTimeEntryValidationRules,
  updateTimeEntryValidationRules,
};
