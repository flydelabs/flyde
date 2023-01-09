module.exports = {
  id: "Modulo",
  inputs: {
    n1: { mode: "required", type: "any" },
    n2: { mode: "required", type: "any" },
  },
  outputs: { r: { type: "any" } },
  completionOutputs: ["r"],
  fn: function (inputs, outputs, adv) {
    const { n1, n2 } = inputs;
    const { r } = outputs;

    // magic here
    r.next(n1 % n2);
  },
};
