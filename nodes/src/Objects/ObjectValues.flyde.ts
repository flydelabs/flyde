import { InternalCodeNode } from "@flyde/core";

const namespace = "Objects";

export const ObjectValues: InternalCodeNode = {
  id: "Values",
  namespace,
  description: "Emits the values of an object",
  inputs: { object: { description: "Object to get values of" } },
  outputs: { values: { description: "The values of object" } },
  run: ({ object }, { values }) => values.next(Object.values(object)),
};
