import {
  InputPin,
  OutputPin,
  NodeStyle,
  RunNodeFunction,
  nodeInput,
  MacroNode,
} from "@flyde/core";

export interface InputPinV2 extends InputPin {
  type?: "text" | "number" | "boolean" | "json" | "longtext" | "enum";
}

export interface OutputPinV2 extends OutputPin {}

export type StaticOrDerived<T, Config> = T | ((config: Config) => T);

export interface MacroNodeV2<Config = {}> {
  id: string;
  defaultConfig: Config;
  namespace?: string;
  menuDisplayName?: string;
  menuDescription?: string;
  defaultStyle?: NodeStyle;
  inputs: StaticOrDerived<Record<string, InputPin>, Config>;
  outputs: StaticOrDerived<Record<string, OutputPin>, Config>;
  completionOutputs?: StaticOrDerived<string[], Config>;
  reactiveInputs?: StaticOrDerived<string[], Config>;
  displayName?: StaticOrDerived<string, Config>;
  description?: StaticOrDerived<string, Config>;

  configEditor: MacroNode<Config>["editorConfig"];
  run: (inputs, outputs, ctx) => ReturnType<RunNodeFunction>;
}

export interface InlineValue2Config {
  type: "string" | "boolean" | "number" | "json";
  value: any;
}

export function extractInputsFromValue(val: unknown): Record<string, InputPin> {
  const inputs = {};

  function extractFromValue(value: any) {
    if (typeof value === "string") {
      const matches = value.match(/({{(.*?)}})/g);
      if (matches) {
        for (const match of matches) {
          const inputName = match.replace(/[{}]/g, "").trim();
          inputs[inputName] = nodeInput();
        }
      }
    }
  }

  if (typeof val === "string") {
    extractFromValue(val);
  } else {
    try {
      const jsonString = JSON.stringify(val);
      const matches = jsonString.match(/({{(.*?)}})/g);
      if (matches) {
        for (const match of matches) {
          const inputName = match.replace(/[{}]/g, "").trim();
          inputs[inputName] = nodeInput();
        }
      }
    } catch (error) {
      console.error("Error stringifying value:", error);
    }
  }

  return inputs;
}

export function replaceInputsInValue<
  V extends string | object | boolean | number
>(inputs: Record<string, string>, value: V): V {
  if (typeof value === "string") {
    return value.replace(/({{(.*?)}})/g, (match, _, inputName) => {
      return inputs[inputName.trim()] ?? match;
    }) as V;
  }

  const jsonString = JSON.stringify(value);
  const replacedJsonString = jsonString.replace(
    /({{(.*?)}})/g,
    (match, _, inputName) => {
      const inputValue = inputs[inputName.trim()];
      return inputValue !== undefined ? inputValue : match;
    }
  );

  try {
    return JSON.parse(replacedJsonString);
  } catch (error) {
    console.error("Error parsing replaced JSON:", error);
    return value;
  }
}

export function macro2toMacro<Config>(
  node: MacroNodeV2<Config>
): MacroNode<Config> {
  return {
    id: node.id,
    defaultData: node.defaultConfig,
    defaultStyle: node.defaultStyle,
    displayName: node.menuDisplayName,
    description: node.menuDescription,
    definitionBuilder: (config) => {
      return {
        inputs:
          typeof node.inputs === "function" ? node.inputs(config) : node.inputs,
        outputs:
          typeof node.outputs === "function"
            ? node.outputs(config)
            : node.outputs,
        displayName:
          typeof node.displayName === "function"
            ? node.displayName(config)
            : node.displayName,
        description:
          typeof node.description === "function"
            ? node.description(config)
            : node.description,
        defaultStyle: node.defaultStyle,
        reactiveInputs:
          typeof node.reactiveInputs === "function"
            ? node.reactiveInputs(config)
            : node.reactiveInputs,
        completionOutputs:
          typeof node.completionOutputs === "function"
            ? node.completionOutputs(config)
            : node.completionOutputs,
      };
    },
    runFnBuilder: (config) => {
      return (inputs, outputs, ctx) => {
        node.run(inputs, outputs, {
          ...ctx,
          context: { ...ctx.context, config },
        });
      };
    },
    editorConfig: node.configEditor,
  };
}
