import {
  macroConfigurableValue,
  MacroConfigurableValue,
  processImprovedMacro,
  CodeNode,
  extractInputsFromValue,
  replaceInputsInValue,
} from "@flyde/core";

export interface InlineValueConfig {
  value: MacroConfigurableValue;
}

const inlineValue: CodeNode<InlineValueConfig> = {
  id: "InlineValue",
  mode: "advanced",
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
    const value = replaceInputsInValue(
      inputs,
      ctx.context.config.value,
      "value"
    );
    outputs.value.next(value);
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../dist/ui/InlineValue.js",
  },
};

export const InlineValue = processImprovedMacro(inlineValue);
