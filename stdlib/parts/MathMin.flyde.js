module.exports = {
  id: "MathMin",
  inputs: {
    n1: { mode: "required", type: "any" },
    n2: { mode: "required", type: "any" },
  },
  outputs: { r: { type: "any" } },
  completionOutputs: ["r"],
  fn: function (inputs, outputs, adv) {
    const { n1, n2 } = inputs;

    outputs.r.next(Math.min(n1, n2));
    // magic here
  },
};
