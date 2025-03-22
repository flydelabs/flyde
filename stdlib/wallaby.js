module.exports = function (w) {
  return {
    files: [
      "dist/**/*",
      "**/*.flyde",
      "src/**/*.ts",
      "src/**/*.tsx",
      "src/**/*.js",
      { pattern: "src/**/*.spec.ts", ignore: true },
      { pattern: "src/**/*.spec.tsx", ignore: true },
      "fixture/**",
    ],

    tests: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
    env: {
      type: "node",
      params: {
        env: "NODE_PATH=fixture/node_modules",
      },
    },
  };
};
