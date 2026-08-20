const { body } = require("express-validator");

const profileValidationRules = [
  body("name")
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("username")
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 3, max: 24 })
    .withMessage("Username must be between 3 and 24 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("bio")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must be 500 characters or fewer"),
  body("skills")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Skills must be an array of strings"),
  body("skills.*")
    .optional({ nullable: true })
    .trim()
    .isString()
    .withMessage("Each skill must be a string"),
  body("portfolioLinks")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Portfolio links must be an array of strings"),
  body("portfolioLinks.*")
    .optional({ nullable: true })
    .trim()
    .isURL()
    .withMessage("Each portfolio link must be a valid URL"),
  body("visibility")
    .optional({ nullable: true })
    .trim()
    .isIn(["public", "private", "connections"])
    .withMessage("Visibility must be one of: public, private, connections"),
];

module.exports = {
  profileValidationRules,
};
