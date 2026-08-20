module.exports = {
  ignorePatterns: ["node_modules/"],
  languageOptions: {
    ecmaVersion: "latest",
  },
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ["eslint:recommended"],
  rules: {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    eqeqeq: ["error", "always"],
    curly: ["error", "all"],
    "consistent-return": "error",
  },
};
