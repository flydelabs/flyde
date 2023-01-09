module.exports = {
  id: "ListLength",
  inputs: { list: { mode: "required", type: "any" } },
  outputs: { length: { type: "any" } },
  completionOutputs: ["length"],
  fn: function (inputs, outputs, adv) {
    // magic here
    outputs.length.next(inputs.list.length);
  },
};
