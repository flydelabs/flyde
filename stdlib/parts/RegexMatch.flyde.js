module.exports = {
  id: "RegexMatch",
  inputs: {
    str: { mode: "required", type: "any" },
    pattern: { mode: "required", type: "any" },
  },
  outputs: { match: { type: "any" }, noMatch: { type: "any" } },
  fn: function (inputs, outputs, adv) {
    const { str, pattern } = inputs;
    const { match, noMatch } = outputs;

    // magic here
    const regex = new RegExp(pattern);
    const matches = str.match(regex);

    if (matches) {
      match.next(matches);
    } else {
      noMatch.next(str);
    }
  },
};
