module.exports = {
  id: "ParseInt",
  inputs: {
    str: { mode: "required", type: "any" },
    base: { mode: "optional", type: "any" },
  },
  outputs: { r: { type: "any" }, e: { type: "any" } },
  fn: function (inputs, outputs, adv) {
    const { str, base } = inputs;
    const { r, e } = outputs;

    // magic here
    const int = parseInt(str, base || 10);
    if (isNaN(int)) {
      e.next(str);
    } else {
      r.next(int);
    }
  },
};
