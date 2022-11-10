module.exports = {
  id: "HttpGet",
  inputs: {
    url: { mode: "required", type: "any" },
    headers: { mode: "required-if-connected", type: "any" },
  },
  outputs: { r: { type: "any" } },
  completionOutputs: ["r"],
  fn: function (inputs, outputs, adv) {
    const axios = require("axios");
    const { url, headers } = inputs;
    const { r, error } = outputs;

    const { onError } = adv;

    // magic here
    axios.get(url, { headers, timeout: 15000 }).then(
      (res) => {
        r.next(res.data);
      },
      (err) => {
        onError(err);
      }
    );
  },
};
