const React = require("react");

module.exports = {
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
