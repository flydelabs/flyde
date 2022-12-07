module.exports = {
  id: "Subtract",
  inputs: { n1: { mode: "required", type: "any" }, n2: { mode: "required", type: "any" } },
  outputs: { difference: { type: "any" } },
  customViewCode:
    '<%= typeof inputs.n1 !== "undefined" ? inputs.n1 : "n1" %> - <%= typeof inputs.n2 !== "undefined" ? inputs.n2 : "n2" %>',
  completionOutputs: ["difference"],
  fn: function (inputs, outputs, adv) {
    const { n1, n2 } = inputs;
    const { difference } = outputs;

    difference.next(n1 - n2);
  },
};
