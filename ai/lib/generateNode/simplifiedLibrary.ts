const http = {
  id: "Http",
  description: "Execute an HTTP request",
  inputs: {
    url: {
      description: "The URL to request",
    },
    method: {
      description: "The HTTP method to use",
      default: "GET",
    },
    body: {
      description: "The body of the request",
    },
  },
  outputs: {
    data: {
      description: "The response from the HTTP request",
    },
  },
};

const getAttribute = {
  id: "GetAttribute",
  description: "Get an attribute from a JSON object",
  inputs: {
    object: {
      description:
        "The JSON object to get the attribute from. Supports dot notation to access object data where it is available",
    },
    key: {
      description: "The attribute to get",
    },
  },
  outputs: {
    value: {
      description: "The value of the attribute",
    },
  },
};

const request = {
  id: "request",
  description: "HTTP request data of the endpoint call",
  outputs: {
    data: {
      description: "An express request object",
    },
  },
};

const response = {
  id: "response",
  description: "HTTP response data of the endpoint call",
  inputs: {
    data: {
      description: "The response data of the endpoint call",
    },
  },
};

const value = {
  id: "InlineValue",
  description: "A static/semi-dynamic value to be used in the node",
  inputs: {
    value: {
      description: "the value that the node will return",
    },
  },
  outputs: {
    value: {
      description: "The value returned by the node",
    },
  },
};

const delay = {
  id: "Delay",
  description: "Delay the execution of the node",
  inputs: {
    value: {
      description: "The value to return after the delay",
    },
    delayMs: {
      description: "The delay in milliseconds",
    },
  },
  outputs: {
    delayedValue: {
      description: "The value returned by the node",
    },
  },
};

const concat = {
  id: "Concat",
  description: "Concatenate two strings",
  inputs: {
    a: {
      description: "The first string to concatenate",
    },
    b: {
      description: "The second string to concatenate",
    },
  },
  outputs: {
    value: {
      description: "The concatenated string",
    },
  },
};

const loop = {
  id: "Loop List",
  description: "Emits all values in a list",
  inputs: {
    list: { description: "The list to loop" },
  },
  outputs: {
    item: { description: "Will emit a value for each item in the list" },
    index: { description: "Will emit the index of the item" },
    length: { description: "Will emit the length of the list" },
  },
};

const collect = {
  id: "Collect",
  description: "Collects all values in a list",
  inputs: {
    list: { description: "The list to collect" },
  },
  outputs: {
    list: { description: "The collected list" },
  },
};

const codeExpression = {
  id: "CodeExpression",
  description:
    "Evaluates a JS expression. Supports dynamic variables via using 'inputs.{{var}}' for example inputs.name. Only inline expressions are supported",
  inputs: {
    value: {
      description: "The expression to evaluate",
    },
  },
  outputs: {
    value: {
      description: "The result of the expression evaluation",
    },
  },
};

export const library = [
  http,
  getAttribute,
  request,
  response,
  value,
  delay,
  concat,
  loop,
  collect,
  codeExpression,
];
