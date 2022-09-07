module.exports = {
  id: "Id",
  inputs: { v: { mode: "required", type: "any" } },
  outputs: { r: { type: "object" } },
  customViewCode: "",
  completionOutputs: ["r"],
  fn: function (inputs, outputs, adv) {
    outputs.r.next(inputs.v);
  },
};
