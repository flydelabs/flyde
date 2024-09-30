import { macroConfigurableValue, MacroConfigurableValue } from "@flyde/core";
import {
  extractInputsFromValue,
  macro2toMacro,
  replaceInputsInValue,
} from "../ImprovedMacros/improvedMacros";

export interface InlineValueConfig {
  value: MacroConfigurableValue;
}

export const InlineValue = macro2toMacro<InlineValueConfig>({
  id: "InlineValue",
  defaultConfig: {
    value: macroConfigurableValue("string", "Hello, {{name}}"),
  },
  inputs: (config) => extractInputsFromValue(config.value, "value"),
  outputs: {
    value: {
      description: "Emits the value configured",
    },
  },
  menuDisplayName: "Inline Value",
  menuDescription:
    "Emits a value each time it's called. Supports dynamic variables",
  defaultStyle: {
    icon: "pencil",
  },
  displayName: (config) => JSON.stringify(config.value.value),
  description: (config) =>
    `Emits the value \`${JSON.stringify(config.value.value)}\``,
  run: (inputs, outputs, ctx) => {
    const value = replaceInputsInValue(inputs, ctx.context.config.value);
    outputs.value.next(value);
  },
  configEditor: {
    type: "custom",
    editorComponentBundlePath: "../../dist/ui/InlineValue.js",
  },
});
