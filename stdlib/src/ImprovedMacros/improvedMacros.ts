import {
  InputPin,
  OutputPin,
  NodeStyle,
  RunNodeFunction,
  nodeInput,
  MacroNode,
  MacroEditorFieldDefinition,
  MacroConfigurableValue,
} from "@flyde/core";

export type StaticOrDerived<T, Config> = T | ((config: Config) => T);

/* This is a draft of a new MacroNode interface that is less verbose and more flexible.
   Will be used to replace the current MacroNode interface in the future.
*/

export interface ImprovedMacroNode<Config = {}> {
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

  configEditor?: MacroNode<Config>["editorConfig"];
  run: (inputs, outputs, ctx) => ReturnType<RunNodeFunction>;
}

export interface InlineValue2Config {
  type: "string" | "boolean" | "number" | "json";
  value: any;
}

// Add this new helper function
function extractInputNameAndPath(match: string): {
  inputName: string;
  path: string[];
} {
  const cleaned = match.replace(/[{}]/g, "").trim();
  const parts = cleaned.split(".");
  return {
    inputName: parts[0],
    path: parts.slice(1),
  };
}

export function extractInputsFromValue(
  val: MacroConfigurableValue,
  key: string
): Record<string, InputPin> {
  const inputs = {};

  function extractFromValue(value: any) {
    if (typeof value === "string") {
      const matches = value.match(/({{.*?}})/g);
      if (matches) {
        for (const match of matches) {
          const { inputName } = extractInputNameAndPath(match);
          inputs[inputName] = nodeInput();
        }
      }
    }
  }

  if (val.type === "string") {
    extractFromValue(val.value);
  } else if (val.type === "dynamic") {
    return { [key]: nodeInput() };
  } else {
    try {
      const jsonString = JSON.stringify(val.value);
      const matches = jsonString.match(/({{.*?}})/g);
      if (matches) {
        for (const match of matches) {
          const { inputName } = extractInputNameAndPath(match);
          inputs[inputName] = nodeInput();
        }
      }
    } catch (error) {
      console.error("Error stringifying value:", error);
    }
  }

  return inputs;
}

export function replaceInputsInValue(
  inputs: Record<string, any>,
  value: MacroConfigurableValue
): MacroConfigurableValue["value"] {
  if (value.type === "string") {
    return value.value.replace(/({{.*?}})/g, (match) => {
      const { inputName, path } = extractInputNameAndPath(match);
      let result = inputs[inputName];
      for (const key of path) {
        if (result && typeof result === "object" && key in result) {
          result = result[key];
        } else {
          return match; // Return original match if path is invalid
        }
      }
      return result !== undefined ? result : match;
    });
  }

  if (value.type === "dynamic") {
    return;
  }

  const jsonString = JSON.stringify(value.value);
  const replacedJsonString = jsonString.replace(/({{.*?}})/g, (match) => {
    const { inputName, path } = extractInputNameAndPath(match);
    let result = inputs[inputName];
    for (const key of path) {
      if (result && typeof result === "object" && key in result) {
        result = result[key];
      } else {
        return match; // Return original match if path is invalid
      }
    }
    return result !== undefined ? result : match;
  });

  try {
    return JSON.parse(replacedJsonString);
  } catch (error) {
    console.error("Error parsing replaced JSON:", error);
    return value;
  }
}

export function macro2toMacro<Config>(
  node: ImprovedMacroNode<Config>
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
        return node.run(inputs, outputs, {
          ...ctx,
          context: { ...ctx.context, config },
        });
      };
    },
    editorConfig: node.configEditor ?? generateConfigEditor(node.defaultConfig),
  };
}

export function generateConfigEditor<Config>(
  config: Config,
  overrides?: Partial<Record<keyof Config, any>>
): MacroNode<Config>["editorConfig"] {
  const fields = Object.keys(config).map((key) => {
    const value = config[key];
    const override = overrides && overrides[key];
    let fieldType: MacroEditorFieldDefinition["type"];

    if (override) {
      fieldType = override.type || (typeof value as any);
    } else {
      switch (typeof value) {
        case "string":
          fieldType = "string";
          break;
        case "number":
          fieldType = "number";
          break;
        case "boolean":
          fieldType = "boolean";
          break;
        case "object":
          fieldType = "json";
          break;
        default:
          fieldType = "string";
          break;
      }
    }

    return {
      type: fieldType,
      configKey: key,
      label:
        override?.label ||
        key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase()),
    };
  });

  return {
    type: "structured",
    fields: fields as MacroEditorFieldDefinition[],
  };
}
