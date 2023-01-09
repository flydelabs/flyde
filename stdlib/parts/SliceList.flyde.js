module.exports = {
  id: "SliceList",
  inputs: {
    list: { mode: "required", type: "any" },
    begin: { mode: "required", type: "any" },
    end: { mode: "required", type: "any" },
  },
  outputs: { r: { type: "any" } },
  completionOutputs: ["r"],
  fn: function (inputs, outputs, adv) {
    // magic here
    const { list, begin, end } = inputs;
    outputs.r.next(list.slice(begin, end));
  },
};
