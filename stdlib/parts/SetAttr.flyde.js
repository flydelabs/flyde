module.exports = {
  id: "SetAttr",
  inputs: {
    obj: { mode: "required", type: "any" },
    k: { mode: "required", type: "any" },
    v: { mode: "required", type: "any" },
  },
  outputs: { r: { type: "any" } },
  completionOutputs: ["r"],
  fn: function (inputs, outputs, adv) {
    const { obj, k, v } = inputs;
    const { r } = outputs;

    // magic here
    r.next({ ...obj, [k]: v });
  },
};
