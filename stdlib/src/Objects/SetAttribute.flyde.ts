import { CodeNode } from "@flyde/core";

const namespace = "Objects";

export const SetAttribute: CodeNode = {
  id: "SetAttribute",
  namespace,
  menuDisplayName: "Set Attribute",
  menuDescription: "Sets an attribute on an object",
  icon: "fa-box",
  inputs: {
    object: {
      description: "Object to set attribute on",
    },
    key: {
      defaultValue: "someKey",
      description: "Key of the attribute to set",
      editorType: "string",
    },
    value: {
      defaultValue: "someValue",
      description: "Value to set the attribute to",
      editorType: "string",
    },
  },
  outputs: {
    object: {
      description: "The object with the attribute set",
    },
  },
  run: (inputs, outputs) => {
    const { key, value, object } = inputs;

    const attributes = key.split(".");
    const last = attributes.pop();
    const target = attributes.reduce((obj, i) => obj[i], object);
    target[last] = value;

    outputs.object.next(object);
  },
};
