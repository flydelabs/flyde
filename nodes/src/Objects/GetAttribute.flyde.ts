import { CodeNode } from "@flyde/core";

export const GetAttribute: CodeNode = {
  id: "GetAttribute",
  namespace: "Objects",
  menuDisplayName: "Get Property",
  menuDescription: "Used to retrieve a property from an object.",
  displayName: 'Get "{{key}}"',
  description: "Retrieves a property from an object",
  icon: "fa-magnifying-glass",
  inputs: {
    object: {
      description: "Object to get attribute from",
    },
    key: {
      label: "Key of the attribute to retrieve",
      defaultValue: "someProperty",
      description: "Supports nested properties with dot notation",
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
