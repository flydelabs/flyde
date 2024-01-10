const path = require("path");

const pairs = [
  { entry: "./src/Lists/ListFrom.tsx", name: "ListFrom" },
  { entry: "./src/Lists/SpreadList.tsx", name: "SpreadList" },
  { entry: "./src/ControlFlow/RoundRobin.tsx", name: "RoundRobin" },
  { entry: "./src/Values/InlineValue.tsx", name: "InlineValue" },
  { entry: "./src/Http/HttpConfigEditor.tsx", name: "Http" },
  { entry: "./src/ControlFlow/Conditional.tsx", name: "Conditional" },
  { entry: "./src/ControlFlow/Switch.tsx", name: "Switch" },
  { entry: "./src/Timing/Delay.tsx", name: "Delay" },
  { entry: "./src/Timing/Debounce.tsx", name: "Debounce" },
  { entry: "./src/Timing/Throttle.tsx", name: "Throttle" },
  { entry: "./src/Timing/Interval.tsx", name: "Interval" },
  // {
  //   entry: "./src/macro-node-simple/InlineValueEditor.tsx",
  //   name: "InlineValue",
  // },
];

module.exports = pairs.map(({ entry, name }) => ({
  entry,
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist", "ui"),
    filename: name + ".js",
    library: {
      name: "__MacroNode__" + name,
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
        exclude: /node_modules/,
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
    "@blueprintjs/core": "Blueprint",
    "@blueprintjs/select": "BlueprintSelect",
  },
}));
