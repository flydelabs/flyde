module.exports = {
  id: "RepeatString",
  inputs: {
    count: { mode: "required", type: "any" },
    char: { mode: "required", type: "any" },
  },
  outputs: { r: { type: "any" } },
  completionOutputs: ["r"],
  fn: function (inputs, outputs, adv) {
    // magic here

    outputs.r.next(new Array(inputs.count).fill(inputs.char));
  },
};
