import { CodeNode } from "@flyde/core";

const namespace = "Objects";

export const JSONStringify: CodeNode = {
  id: "JSON Stringify",
  defaultStyle: {
    icon: "fa-pen-fancy",
  },
  namespace,
  description: "Stringifies an object into a JSON string",
  inputs: { object: { description: "Object to stringify" } },
  outputs: { json: { description: "The stringified JSON" } },
  run: ({ object }, { json }) => json.next(JSON.stringify(object)),
};
