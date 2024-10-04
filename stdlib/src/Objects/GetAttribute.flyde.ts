import { macroConfigurableValue, MacroConfigurableValue } from "@flyde/core";
import {
  ImprovedMacroNode,
  extractInputsFromValue,
  replaceInputsInValue,
  improvedMacroToOldMacro,
} from "../ImprovedMacros/improvedMacros";

export interface GetAttributeConfig {
  key: MacroConfigurableValue;
}

const getAttribute: ImprovedMacroNode<GetAttributeConfig> = {
  id: "GetAttribute",
  namespace: "Objects",
  defaultConfig: {
    key: macroConfigurableValue("string", "someProperty"),
  },
  menuDisplayName: "Get Property",
  menuDescription: "Used to retrieve a property from an object.",
  defaultStyle: {
    icon: "fa-magnifying-glass",
  },
  inputs: (config) => ({
    object: {
      description: "Object to get attribute from",
    },
    ...extractInputsFromValue(config.key, "key"),
  }),
  outputs: {
    value: {
      description: "The value of the attribute",
    },
  },
  displayName: (config) => `Get Attribute "${config.key.value}"`,
  description: (config) =>
    `Gets the attribute "${config.key.value}" from an object`,
  configEditor: {
    type: "structured",
    fields: [
      {
        type: "string",
        configKey: "key",
        label: "Key",
      },
    ],
  },
  run: (inputs, outputs, adv) => {
    const { key } = adv.context.config;
    const { object } = inputs;

    const _key = replaceInputsInValue(inputs, key, "key");

    outputs.value.next(_key.split(".").reduce((obj, i) => obj[i], object));
  },
};

export const GetAttribute = improvedMacroToOldMacro(getAttribute);
