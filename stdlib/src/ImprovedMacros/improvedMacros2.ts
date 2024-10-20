import {
  CodeNode,
  InputMode,
  InputPin,
  MacroConfigurableValue,
  macroConfigurableValue,
  MacroEditorFieldDefinition,
  MacroNode,
  NodeStyle,
  OutputPin,
} from "@flyde/core";
import {
  extractInputsFromValue,
  generateConfigEditor,
  replaceInputsInValue,
} from "./improvedMacroUtils";

export type StaticOrDerived<T, Config> = T | ((config: Config) => T);

export interface BaseMacroNodeData<Config = any> {
  id: string;
  namespace?: string;
  menuDisplayName?: string;
  menuDescription?: string;
  displayName?: StaticOrDerived<string, Config>;
  description?: StaticOrDerived<string, Config>;
  icon?: string;

  completionOutputs?: StaticOrDerived<string[], Config>;
  run: CodeNode["run"];
}

export interface SimplifiedMacroNode<Config> extends BaseMacroNodeData<Config> {
  inputs: Record<string, InputConfig>;
  outputs: Record<
    string,
    {
      description?: string;
    }
  >;
}

export interface AdvancedMacroNode<Config> extends BaseMacroNodeData<Config> {
  inputs: StaticOrDerived<Record<string, InputPin>, Config>;
  outputs: StaticOrDerived<Record<string, OutputPin>, Config>;
  reactiveInputs?: StaticOrDerived<string[], Config>;
  defaultConfig: Config;
  editorConfig?: MacroNode<Config>["editorConfig"];
  defaultStyle?: NodeStyle;
}

export type ImprovedMacroNode2<Config = any> =
  | SimplifiedMacroNode<Config>
  | AdvancedMacroNode<Config>;

type InputConfig = {
  defaultValue?: any;
  description?: string;
  mode?: InputMode | "reactive";
} & EditorTypeConfig;

type EditorTypeConfig = {
  [K in EditorType]: {
    editorType?: K;
    editorTypeData?: EditorTypeDataMap[K];
  };
}[EditorType];

type EditorType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "select"
  | "longtext"
  | "enum";

type EditorTypeDataMap = {
  string: undefined;
  number: { min?: number; max?: number };
  boolean: undefined;
  json: undefined;
  select: { options: string[] | { value: string | number; label: string }[] };
  longtext: { rows?: number };
  enum: { options: string[] };
};

function inferTypeFromInput(
  input: InputConfig
): MacroConfigurableValue["type"] {
  const rawType = typeof input.defaultValue;
  switch (rawType) {
    case "undefined":
      return "dynamic";
    case "object":
      if (input.defaultValue !== null) {
        return "json";
      }
      break;
    case "string":
      if (input.editorType === "select") {
        return "select";
      }
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "json";
  }
}

export function isAdvancedMacroNode<Config>(
  node: ImprovedMacroNode2<Config>
): node is AdvancedMacroNode<Config> {
  return (node as AdvancedMacroNode<Config>).defaultConfig !== undefined;
}

export function improvedMacro2ToOldMacro(
  node: ImprovedMacroNode2
): MacroNode<any> {
  const isAdvanced = isAdvancedMacroNode(node);

  if (isAdvanced) {
    return {
      id: node.id,
      defaultData: node.defaultConfig,
      defaultStyle: node.defaultStyle,
      displayName: node.menuDisplayName,
      description: node.menuDescription,
      namespace: node.namespace,
      definitionBuilder: (config) => {
        return {
          inputs:
            typeof node.inputs === "function"
              ? node.inputs(config)
              : node.inputs,
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
      editorConfig:
        node.editorConfig ?? generateConfigEditor(node.defaultConfig),
    };
  } else {
    const defaultData = Object.keys(node.inputs).reduce((acc, key) => {
      const input = node.inputs[key];
      const type = inferTypeFromInput(input);
      acc[key] = macroConfigurableValue(
        type,
        input.defaultValue ?? `{{${key}}}`
      );
      return acc;
    }, {} as Record<string, any>);

    const editorFields: MacroEditorFieldDefinition[] = Object.keys(
      node.inputs
    ).map((key) => {
      const input = node.inputs[key];
      const type = input.editorType ?? inferTypeFromInput(input);
      return {
        type,
        configKey: key,
        typeData: input.editorTypeData,
        label: input.description,
      } as MacroEditorFieldDefinition;
    });

    return {
      id: node.id,
      namespace: node.namespace,
      displayName: node.menuDisplayName,
      defaultStyle: {
        icon: node.icon,
      },
      defaultData,
      definitionBuilder: (config) => {
        return {
          inputs: Object.keys(config).reduce((acc, key) => {
            return {
              ...acc,
              ...extractInputsFromValue(config[key], key),
            };
          }, {}),
          outputs: node.outputs,
          completionOutputs:
            typeof node.completionOutputs === "function"
              ? node.completionOutputs(config)
              : node.completionOutputs,
          reactiveInputs: Object.keys(node.inputs).filter(
            (key) => node.inputs[key].mode === "reactive"
          ),
          description:
            typeof node.description === "function"
              ? node.description(config)
              : node.description,
          displayName:
            typeof node.displayName === "function"
              ? node.displayName(config)
              : node.displayName,
        };
      },
      runFnBuilder: (config) => {
        return (inputs, outputs, adv) => {
          const inputValues = Object.keys(config).reduce((acc, key) => {
            acc[key] = replaceInputsInValue(inputs, config[key], key);
            return acc;
          }, {} as Record<string, any>);
          return node.run(inputValues, outputs, adv);
        };
      },
      editorConfig: {
        type: "structured",
        fields: editorFields,
      },
    };
  }
}
