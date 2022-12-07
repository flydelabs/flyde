module.exports = {
  id: "HttpPost",
  inputs: {
    url: { mode: "required", type: "any" },
    body: { mode: "required", type: "any" },
    headers: { mode: "required-if-connected", type: "any" },
    bodyType: { mode: "required-if-connected", type: "any" },
  },
  completionOutputs: ['response'],
  outputs: {response: { type: "any" }},
  fn: function (inputs, outputs, adv) {
    const axios = require("axios");
    const { url, body, headers, bodyType } = inputs;
    const { response } = outputs;

    const { onError } = adv;

    const config = {
      headers,
      timeout: 15000,
    };

    // magic here
    if (bodyType === "form") {
      const parts = [];
      Object.keys(body).forEach((key) => {
        parts.push(`${key}=${encodeURIComponent(body[key])}`);
      });
      axios.post(url, parts.join("&"), config).then(
        (res) => {
          response.next(res.data);
        },
        (err) => {
          const { response, message } = err;
          const errorObj = response
            ? { data: response.data, status: response.status }
            : { data: message, status: -1 };
          onError(errorObj);
        }
      );
    } else {
      axios.post(url, body, config).then(
        (res) => {
          response.next(res.data);
        },
        (err) => {
          const { response, message } = err;
          const errorObj = response
            ? { data: response.data, status: response.status }
            : { data: message, status: -1 };
          onError(errorObj);
        }
      );
    }
  },
};
