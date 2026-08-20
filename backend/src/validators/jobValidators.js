const { body, query, param } = require("express-validator");

const createJobRules = [
  body("title").trim().notEmpty().withMessage("Job title is required"),
  body("company").trim().notEmpty().withMessage("Company name is required"),
  body("description").optional().trim(),
  body("location").optional().trim(),
  body("employmentType").optional().trim(),
  body("experienceLevel").optional().trim(),
  body("salaryMin").optional().isInt({ min: 0 }).withMessage("Minimum salary must be a positive integer"),
  body("salaryMax").optional().isInt({ min: 0 }).withMessage("Maximum salary must be a positive integer"),
  body("skills").optional().isArray().withMessage("Skills must be an array of strings"),
  body("category").optional().trim(),
  body("expiresAt").optional().isISO8601().withMessage("Expires at must be a valid ISO8601 date"),
];

const updateJobRules = [
  body("title").optional().trim().notEmpty().withMessage("Job title cannot be empty"),
  body("company").optional().trim().notEmpty().withMessage("Company name cannot be empty"),
  body("description").optional().trim(),
  body("location").optional().trim(),
  body("employmentType").optional().trim(),
  body("experienceLevel").optional().trim(),
  body("salaryMin").optional().isInt({ min: 0 }).withMessage("Minimum salary must be a positive integer"),
  body("salaryMax").optional().isInt({ min: 0 }).withMessage("Maximum salary must be a positive integer"),
  body("skills").optional().isArray().withMessage("Skills must be an array of strings"),
  body("category").optional().trim(),
  body("expiresAt").optional().isISO8601().withMessage("Expires at must be a valid ISO8601 date"),
  body("status").optional().isIn(["OPEN", "CLOSED"]).withMessage("Status must be OPEN or CLOSED"),
];

const applyJobRules = [
  body("resumeUrl").optional().trim().isURL().withMessage("Resume URL must be a valid URL"),
  body("coverLetter").optional().trim(),
];

const jobSearchQueryRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("salaryMin").optional().isInt({ min: 0 }).withMessage("salaryMin must be a positive integer"),
  query("salaryMax").optional().isInt({ min: 0 }).withMessage("salaryMax must be a positive integer"),
  query("status").optional().isIn(["OPEN", "CLOSED"]).withMessage("Status filter must be OPEN or CLOSED"),
  query("sort").optional().isIn(["latest", "salary", "oldest"]).withMessage("Invalid sort parameter"),
  query("keyword").optional().trim(),
  query("location").optional().trim(),
  query("company").optional().trim(),
  query("category").optional().trim(),
  query("skills").optional().trim(),
];

const updateApplicationStatusRules = [
  body("status").trim().isIn(["PENDING", "REVIEWED", "SHORTLISTED", "REJECTED", "ACCEPTED"]).withMessage("Invalid application status"),
];

const idParamRules = [
  param("id").trim().notEmpty().withMessage("ID parameter is required"),
];

module.exports = {
  createJobRules,
  updateJobRules,
  applyJobRules,
  jobSearchQueryRules,
  updateApplicationStatusRules,
  idParamRules,
};
