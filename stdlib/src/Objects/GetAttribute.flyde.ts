import {
  MacroNodeV2,
  extractInputsFromValue,
  replaceInputsInValue,
  macro2toMacro,
} from "../ImprovedMacros/improvedMacros";

export interface GetAttributeConfig {
  key: string;
}

const getAttribute: MacroNodeV2<GetAttributeConfig> = {
  id: "GetAttribute",
  namespace: "Objects",
  defaultConfig: {
    key: "",
  },
  menuDisplayName: "Get Attribute",
  menuDescription: "Gets an attribute from an object",
  defaultStyle: {
    icon: "fa-magnifying-glass",
  },
  inputs: (config) => ({
    object: {
      description: "Object to get attribute from",
    },
    ...extractInputsFromValue(config.key),
  }),
  outputs: {
    value: {
      description: "The value of the attribute",
    },
  },
  displayName: (config) => `Get Attribute "${config.key}"`,
  description: (config) => `Gets the attribute "${config.key}" from an object`,
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

    const _key = replaceInputsInValue(inputs, key);

    outputs.value.next(_key.split(".").reduce((obj, i) => obj[i], object));
  },
};

export const GetAttribute = macro2toMacro(getAttribute);
