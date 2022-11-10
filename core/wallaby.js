module.exports = function (w) {
  const path = require("path");
  process.env.NODE_PATH += path.delimiter + path.join(w.localProjectDir, "../", "node_modules");
  return {
    files: [
      "src/**/*.ts",
      "src/**/*.tsx",
      { pattern: "src/**/spec.ts", ignore: true },
      { pattern: "src/**/spec.tsx", ignore: true },
    ],

    tests: ["src/**/spec.ts", "src/**/spec.tsx"],
    env: {
      type: "node",
    },
    setup: () => {
      // setup code here
    },
  };
};
