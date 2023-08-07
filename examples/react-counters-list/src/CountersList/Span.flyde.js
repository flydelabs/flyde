const React = require("react"); // hack to workaround esm complexities

const node = {
  id: "Span",
  inputs: {
    children: { type: "any", mode: "required" },
  },
  outputs: {
    jsx: { type: "any" },
  },
  completionOutputs: ["jsx"],
  run: function (inputs, outputs) {
    const comp = React.createElement("span", {}, inputs.children);

    outputs.jsx.next(comp);
  },
};

module.exports = node;
