import {
  configurableValue,
  ConfigurableValue,
  CodeNode,
  extractInputsFromValue,
  replaceInputsInValue,
} from "@flyde/core";

export interface InlineValueConfig {
  value: ConfigurableValue;
}

export const InlineValue: CodeNode<InlineValueConfig> = {
  id: "InlineValue",
  mode: "advanced",
  defaultConfig: {
    value: configurableValue("string", "Hello, {{name}}"),
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
  icon: "pencil",
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
    type: "structured",
    fields: [
      {
        type: "longtext",
        label: "Value",
        configKey: "value",
        description: "The value to emit. Supports dynamic variables using {{syntax}}",
        aiCompletion: {
          prompt: `You are an expert at generating values with variables. The user will provide a description of the value they want to use, and you should create a valid representation with appropriate dynamic variables.
You can expose dynamic variables using the {{syntax}}, for example "Hello, {{name}}" will expose the "name" as a dynamic input.
Only expose variables if needed, otherwise avoid them.

## Previous value:
{{value}}

## User request:
{{prompt}}

Prefer camelCase for variable names. Return only the generated value with no code formatting or backticks.`,
          placeholder: "Describe the value you want to generate"
        }
      }
    ]
  },
};
