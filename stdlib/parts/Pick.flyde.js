const isDefined = (obj) => typeof obj !== "undefined";

module.exports = {
  id: "Pick",
  defaultStyle: {
    size: 'small'
  },
  inputs: { obj: { mode: "required", type: "any" }, key: { mode: "required", type: "any" } },
  outputs: { r: { type: "any" }, e: { type: "any" } },
  customViewCode: '<% if (inputs.key) { %> Pick "<%- inputs.key %>" <% } else { %> Pick <% } %>',
  completionOutputs: ["r", "e"],
  fn: function (inputs, outputs, adv) {
    const { obj, key } = inputs;
    const { r, e } = outputs;

    // magic here

    let hadError = false;

    const matches = {};

    const normalized = key.replace(/\["(([^"])+)"\]/g, (match, p1, p2, offset) => {
      const key = `__$KEY$__${offset}`;
      matches[key] = p1;
      return `.${key}`;
    });

    // outputs.log.next({matches, normalized});

    const path = normalized.split(".");
    let o = { ...obj };
    for (let p of path) {
      const key = matches[p] || p;
      if (o && typeof o[key] !== 'undefined' && o[key] !== null) {
        o = o[key];
      } else {
        e.next(obj);
        hadError = true;
      }
    }

    if (!hadError) {
      r.next(o);
    }
  },
};
