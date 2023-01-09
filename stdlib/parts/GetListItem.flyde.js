module.exports = {
  id: "GetListItem",
  inputs: {
    list: { mode: "required", type: "any" },
    idx: { mode: "required", type: "any" },
  },
  outputs: { r: { type: "any" } },
  completionOutputs: ["r"],
  fn: function (inputs, outputs, adv) {
    // magic here
    outputs.r.next(inputs.list[inputs.idx]);
  },
};
