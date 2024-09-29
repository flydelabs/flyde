import { MacroNode } from "@flyde/core";
import {
  extractInputsFromValue,
  macro2toMacro,
  replaceInputsInValue,
} from "../ImprovedMacros/improvedMacros";

export interface InlineValueConfig {
  type: "string" | "boolean" | "number" | "json";
  value: string;
}

export const InlineValue: MacroNode<InlineValueConfig> = {
  id: "InlineValue",
  displayName: "Value",
  defaultStyle: {
    icon: "pen",
  },
  description: "A static value or JS expression",
  runFnBuilder: (config) => {
    return (_, outputs) => {
      outputs.value.next(config.value);
    };
  },
  definitionBuilder: (config) => {
    return {
      defaultStyle: {
        size: "small",
        icon: "pen",
      },
      displayName: JSON.stringify(config.value),
      description: `Emits the value \`${JSON.stringify(config.value)}\``,
      inputs: {},
      outputs: {
        value: {
          displayName: "Value",
          description: "Emits the value configured",
        },
      },
    };
  },
  defaultData: {
    type: "string",
    value: "Hello",
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../dist/ui/InlineValue.js",
  },
};

export const inlineV2 = macro2toMacro<InlineValueConfig>({
  id: "InlineValue",
  defaultConfig: {
    type: "string",
    value: "",
  },
  inputs: (config) => extractInputsFromValue(config.value),
  outputs: {
    value: {
      description: "Emits the value configured",
    },
  },
  displayName: (config) => JSON.stringify(config.value),
  description: (config) =>
    `Emits the value \`${JSON.stringify(config.value)}\``,
  run: (inputs, outputs, ctx) => {
    const value = replaceInputsInValue(inputs, ctx.context.config.value);
    outputs.value.next(value);
  },
  configEditor: {
    type: "custom",
    editorComponentBundlePath: "../../dist/ui/InlineValue.js",
  },
});
