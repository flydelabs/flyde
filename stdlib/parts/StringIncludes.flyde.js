module.exports = {
  id: "StringIncludes",
  inputs: {
    str: { mode: "required", type: "any" },
    strToFind: { mode: "required", type: "any" },
  },
  outputs: { r: { type: "any" }, else: { type: "any" } },
  customViewCode: "",
  fn: function (inputs, outputs, adv) {
    const { str, strToFind } = inputs;
    const { r } = outputs;

    // magic here
    if (str.includes(strToFind)) {
      r.next(str);
    } else {
      outputs["else"].next(str);
    }
  },
};
