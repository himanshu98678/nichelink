module.exports = [
  {
    ignores: ["node_modules/", ".postgres/", "uploads/", "coverage/", "dist/", "build/", "*.min.js"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
      },
      globals: {
        NodeJS: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly",
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
    rules: {
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "consistent-return": "error",
    },
  },
];
