module.exports = {
  id: "ListJoin",
  inputs: {
    list: { mode: "required", type: "any" },
    delimiter: { mode: "required", type: "any" },
  },
  outputs: { r: { type: "any" } },
  completionOutputs: ["r"],
  fn: function (inputs, outputs, adv) {
    const { list, delimiter } = inputs;
    const { r } = outputs;

    // magic here
    r.next(list.join(delimiter));
  },
};
