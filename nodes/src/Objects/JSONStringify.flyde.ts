import { InternalCodeNode } from "@flyde/core";

const namespace = "Objects";

export const JSONStringify: InternalCodeNode = {
  id: "JSON Stringify",
  icon: "fa-pen-fancy",
  namespace,
  description: "Stringifies an object into a JSON string",
  inputs: { object: { description: "Object to stringify" } },
  outputs: { json: { description: "The stringified JSON" } },
  run: ({ object }, { json }) => json.next(JSON.stringify(object, null, "\t")),
};
