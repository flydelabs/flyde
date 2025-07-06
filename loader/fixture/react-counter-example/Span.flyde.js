const React = require("react");

module.exports = {
  id: "Span",
  inputs: {
    children: "any",
  },
  outputs: {
    jsx: "any",
  },
  completionOutputs: ["jsx"],
  run: function (inputs, outputs) {
    const comp = React.createElement("span", {}, inputs.children);

    outputs.jsx.next(comp);
  },
};
