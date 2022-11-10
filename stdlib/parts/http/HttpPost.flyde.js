module.exports = {
  id: "HttpPost",
  inputs: {
    url: { mode: "required", type: "any" },
    body: { mode: "required", type: "any" },
    headers: { mode: "required-if-connected", type: "any" },
    bodyType: { mode: "required-if-connected", type: "any" },
  },
  outputs: { r: { type: "any" }, e: { type: "any" } },
  fn: function (inputs, outputs, adv) {
    const axios = require("axios");
    const { url, body, headers, bodyType } = inputs;
    const { r, e } = outputs;

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
          r.next(res.data);
        },
        (err) => {
          const { response, message } = err;
          const errorObj = response
            ? { data: response.data, status: response.status }
            : { data: message, status: -1 };
          e.next(errorObj);
          onError(errorObj);
        }
      );
    } else {
      axios.post(url, body, config).then(
        (res) => {
          r.next(res.data);
        },
        (err) => {
          const { response, message } = err;
          const errorObj = response
            ? { data: response.data, status: response.status }
            : { data: message, status: -1 };
          e.next(errorObj);
          onError(errorObj);
        }
      );
    }
  },
};
