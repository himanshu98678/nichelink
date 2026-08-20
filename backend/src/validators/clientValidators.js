const { body } = require("express-validator");

const createClientValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must be 100 characters or fewer"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address"),
  body("phone")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 32 })
    .withMessage("Phone must be 32 characters or fewer"),
  body("company")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Company must be 100 characters or fewer"),
  body("address")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage("Address must be 255 characters or fewer"),
  body("notes")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be 1000 characters or fewer"),
];

const updateClientValidationRules = [
  body("name")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Name must be 100 characters or fewer"),
  body("email")
    .optional({ nullable: true })
    .trim()
    .isEmail()
    .withMessage("Email must be a valid email address"),
  body("phone")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 32 })
    .withMessage("Phone must be 32 characters or fewer"),
  body("company")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Company must be 100 characters or fewer"),
  body("address")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage("Address must be 255 characters or fewer"),
  body("notes")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be 1000 characters or fewer"),
];

module.exports = {
  createClientValidationRules,
  updateClientValidationRules,
};
