module.exports = {
  id: "Add",
  inputs: {
    a: { mode: "required", type: "number" },
    b: { mode: "required", type: "number" },
  },
  outputs: {
    r: "number",
  },
  run: (inputs, outputs) => {
    outputs.r.next(inputs.a + inputs.b);
  },
  customViewCode:
    "<% if (inputs.ms) { %> Debounce  <%- inputs.ms %>ms <% } else { %> Debounce <% } %>",
};
