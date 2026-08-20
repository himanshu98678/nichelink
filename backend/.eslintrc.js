module.exports = {
  ignorePatterns: ["node_modules/", ".postgres/", "uploads/", "coverage/", "dist/", "build/", "*.min.js"],  ignores: ["node_modules/", ".postgres/", "uploads/", "coverage/", "dist/", "build/", "*.min.js"],  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    eqeqeq: ["error", "always"],
    curly: ["error", "all"],
    "consistent-return": "error",
  },
};
