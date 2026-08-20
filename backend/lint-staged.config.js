module.exports = {
  "**/*.{js,json,md,yml,yaml}": [
    "prettier --write",
    "eslint --fix"
  ]
};
