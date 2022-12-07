module.exports = {
  id: "HttpGet",
  inputs: {
    url: { mode: "required", type: "any" },
    headers: { mode: "required-if-connected", type: "any" },
  },
  outputs: { response: { type: "any" } },
  completionOutputs: ["response"],
  fn: function (inputs, outputs, adv) {
    const axios = require("axios");
    const { url, headers } = inputs;
    const { response } = outputs;

    const { onError } = adv;

    // magic here
    axios.get(url, { headers, timeout: 15000 }).then(
      (res) => {
        response.next(res.data);
      },
      (err) => {
        onError(err);
      }
    );
  },
};
