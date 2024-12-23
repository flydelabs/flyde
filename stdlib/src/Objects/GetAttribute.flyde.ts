import { ImprovedMacroNode, processImprovedMacro } from "@flyde/core";

const getAttribute: ImprovedMacroNode = {
  id: "GetAttribute",
  namespace: "Objects",
  menuDisplayName: "Get Property",
  menuDescription: "Used to retrieve a property from an object.",
  icon: "fa-magnifying-glass",
  inputs: {
    object: {
      description: "Object to get attribute from",
    },
    key: {
      defaultValue: "someProperty",
      description: "Key of the attribute to retrieve",
      editorType: "string",
    },
  },
  outputs: {
    value: {
      description: "The value of the attribute",
    },
  },
  run: (inputs, outputs) => {
    const { key, object } = inputs;
    outputs.value.next(key.split(".").reduce((obj, i) => obj[i], object));
  },
};
export const GetAttribute = processImprovedMacro(getAttribute);
