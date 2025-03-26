import { InternalCodeNode } from "@flyde/core";

const namespace = "Objects";

export const ObjectEntries: InternalCodeNode = {
  id: "Entries",
  icon: "fa-box",
  namespace,
  description: "Emits the entries of an object",
  inputs: { object: { description: "Object to get entries of" } },
  outputs: { entries: { description: "The entries of object" } },
  run: ({ object }, { entries }) => entries.next(Object.entries(object)),
};
