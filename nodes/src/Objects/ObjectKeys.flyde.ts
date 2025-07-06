import { InternalCodeNode } from "@flyde/core";

const namespace = "Objects";

export const ObjectKeys: InternalCodeNode = {
  id: "Keys",
  icon: "fa-key",
  namespace,
  description: "Emits the keys of an object",
  inputs: { object: { description: "Object to get keys of" } },
  outputs: { keys: { description: "The keys of object" } },
  run: ({ object }, { keys }) => keys.next(Object.keys(object)),
};
