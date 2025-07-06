module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "local-rules"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["dist/**/*"],
  rules: {
    "local-rules/one-node-per-file": "error",
    "local-rules/only-node-exports": "error",
  },
};
