import {
  macro2toMacro,
  MacroNodeV2,
  extractInputsFromValue,
  replaceInputsInValue,
} from "../ImprovedMacros/improvedMacros";

const namespace = "Objects";

export interface SetAttributeConfig {
  key: string;
  value: unknown;
}

const setAttribute2: MacroNodeV2<SetAttributeConfig> = {
  id: "SetAttribute",
  defaultConfig: {
    key: "",
    value: "",
  },
  namespace,
  menuDisplayName: "Set Attribute",
  menuDescription: "Sets an attribute on an object",
  defaultStyle: {
    icon: "fa-box",
  },
  inputs: (config) => ({
    object: {
      description: "Object to set attribute on",
    },
    ...extractInputsFromValue(config.key),
    ...extractInputsFromValue(config.value),
  }),
  outputs: {
    object: {
      description: "The object with the attribute set",
    },
  },
  displayName: (config) => `Set Attribute "${config.key}"`,
  description: (config) =>
    `Sets the attribute "${config.key}" on an object to the provided value`,
  configEditor: {
    type: "structured",
    fields: [
      {
        type: {
          value: "string",
        },
        configKey: "key",
        label: "Key",
        defaultValue: "",
      },
      {
        type: {
          value: "json",
        },
        configKey: "value",
        label: "Value",
        defaultValue: "",
      },
    ],
  },
  run: (inputs, outputs, adv) => {
    const { key, value } = adv.context.config;
    const { object } = inputs;

    const _key = replaceInputsInValue(inputs, key);
    const _value = replaceInputsInValue(inputs, value);

    const attributes = _key.split(".");
    const last = attributes.pop();
    const target = attributes.reduce((obj, i) => obj[i], object);
    target[last] = _value;

    outputs.object.next(object);
  },
};

export const SetAttribute = macro2toMacro(setAttribute2);
