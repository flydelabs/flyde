module.exports = {
  id: "ListConcat2",
  inputs: {
    list1: { mode: "required", type: "any" },
    list2: { mode: "required", type: "any" },
  },
  outputs: { r: { type: "any" } },
  completionOutputs: ["r"],
  fn: function (inputs, outputs, adv) {
    // magic here
    const { list1, list2 } = inputs;
    outputs.r.next(list1.concat(list2));
  },
};
