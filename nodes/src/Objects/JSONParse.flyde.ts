import { InternalCodeNode } from "@flyde/core";

const namespace = "Objects";

export const JSONParse: InternalCodeNode = {
  id: "JSON Parse",
  icon: "fa-glasses",
  namespace,
  description: "Parses a JSON string into an object",
  inputs: { json: { description: "JSON string to parse" } },
  outputs: { object: { description: "The parsed object" } },
  run: ({ json }, { object }) => object.next(JSON.parse(json)),
};
