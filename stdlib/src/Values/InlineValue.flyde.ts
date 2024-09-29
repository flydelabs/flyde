import {
  extractInputsFromValue,
  macro2toMacro,
  replaceInputsInValue,
} from "../ImprovedMacros/improvedMacros";

export interface InlineValueConfig {
  type: "string" | "boolean" | "number" | "json";
  value: string;
}

export const InlineValue = macro2toMacro<InlineValueConfig>({
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
