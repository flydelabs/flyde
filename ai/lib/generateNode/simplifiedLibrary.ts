const http = {
  id: "HTTP",
  description: "Execute an HTTP request",
  inputs: {
    url: {
      type: "string",
      description: "The URL to request",
    },
    method: {
      type: "string",
      description: "The HTTP method to use",
      default: "GET",
    },
  },
  outputs: {
    response: {
      type: "string",
      description: "The response from the HTTP request",
    },
  },
};

const getAttribute = {
  id: "getAttribute",
  description: "Get an attribute from a JSON object",
  inputs: {
    json: {
      type: "object",
      description: "The JSON object to get the attribute from",
    },
    attribute: {
      type: "string",
      description: "The attribute to get",
    },
  },
  outputs: {
    attribute: {
      type: "string",
      description: "The value of the attribute",
    },
  },
};

const request = {
  id: "request",
  description: "HTTP request data of the endpoint call",
  outputs: {
    data: {
      type: "object",
      description: "An express request object",
    },
  },
};

const response = {
  id: "response",
  description: "HTTP response data of the endpoint call",
  inputs: {
    data: {
      type: "any",
      description: "The response data of the endpoint call",
    },
  },
};

const value = {
  id: "InlineValue",
  description: "A static/semi-dynamic value to be used in the node",
  inputs: {
    value: {
      type: "any",
      description: "the value that the node will return",
    },
  },
  outputs: {
    value: {
      type: "any",
      description: "The value returned by the node",
    },
  },
};

export const library = [http, getAttribute, request, response, value];
