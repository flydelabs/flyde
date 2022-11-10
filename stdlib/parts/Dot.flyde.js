module.exports = {
  id: "Dot",
  defaultStyle: {
    size: 'small'
  },
  inputs: { obj: { mode: "required", type: "any" }, key: { mode: "required", type: "any" } },
  outputs: { value: { type: "any" } },
  customViewCode: "<% if (inputs.key) { %> .<%- inputs.key %> <% } else { %> Dot <% } %>",
  completionOutputs: ["value"],
  fn: function (inputs, outputs, adv) {
    const { obj, key } = inputs;
    const { value } = outputs;

    // magic here

    let hadError = false;

    const matches = {};

    const normalized = key.replace(/\["(([^"])+)"\]/g, (match, p1, p2, offset) => {
      const key = `__$KEY$__${offset}`;
      matches[key] = p1;
      return `.${key}`;
    });

    const path = normalized.split(".");
    let o = { ...obj };
    for (let p of path) {
      const key = matches[p] || p;
      if (o && (typeof o[key] !== 'undefined') && o[key] !== null) {
        o = o[key];
      } else {
        value.next(null);
        hadError = true;
      }
    }

    if (!hadError) {
      value.next(o);
    }
  },
};
