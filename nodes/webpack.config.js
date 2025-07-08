const path = require("path");

const pairs = [
  { entry: "./src/Values/CodeExpression.tsx", name: "CodeExpression" },
  {
    entry: "./src/ControlFlow/Conditional/Conditional.tsx",
    name: "Conditional",
  },
  { entry: "./src/ControlFlow/Switch.tsx", name: "Switch" },
  { entry: "./src/Lists/Collect/Collect.tsx", name: "Collect" },
  { entry: "./src/Note/Note.tsx", name: "Note" },
];

module.exports = pairs.map(({ entry, name }) => ({
  entry,
  mode: "production",
  output: {
    path: path.resolve(__dirname, "dist", "ui"),
    filename: name + ".js",
    library: {
      name: "__NodeConfig__" + name,
      type: "window",
    },
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: [/node_modules/, /\.spec\.tsx?$/],
      },
      // CSS Loader
      {
        test: /\.css$/,
        use: [
          "style-loader", // Injects styles into the DOM.
          "css-loader", // Interprets `@import` and `url()` like `import/require()`
        ],
      },
    ],
  },
  externals: {
    // Do not bundle React and ReactDOM, assume they're available externally
    react: "React",
    "react-dom": "ReactDOM",
  },
}));
