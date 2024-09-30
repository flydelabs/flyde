import { macroConfigurableValue, MacroConfigurableValue } from "@flyde/core";
import {
  macro2toMacro,
  MacroNodeV2,
  extractInputsFromValue,
  replaceInputsInValue,
} from "../ImprovedMacros/improvedMacros";

const namespace = "Objects";

export interface SetAttributeConfig {
  key: MacroConfigurableValue;
  value: MacroConfigurableValue;
}

const setAttribute2: MacroNodeV2<SetAttributeConfig> = {
  id: "SetAttribute",
  defaultConfig: {
    key: macroConfigurableValue("string", "someKey"),
    value: macroConfigurableValue("string", "someValue"),
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
    ...extractInputsFromValue(config.key, "key"),
    ...extractInputsFromValue(config.value, "value"),
  }),
  outputs: {
    object: {
      description: "The object with the attribute set",
    },
  },
  displayName: (config) => `Set Attribute "${config.key.value}"`,
  description: (config) =>
    `Sets the attribute "${config.key.value}" on an object to the provided value`,
  configEditor: {
    type: "structured",
    fields: [
      {
        type: "string",
        configKey: "key",
        label: "Key",
      },
      {
        type: "string",
        configKey: "value",
        label: "Value",
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
