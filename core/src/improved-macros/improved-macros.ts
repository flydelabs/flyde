import {
  CodeNode,
  InputPin,
  OutputPin,
  MacroNode,
  NodeStyle,
  InputMode,
  MacroConfigurableValue,
  macroConfigurableValue,
  MacroEditorFieldDefinition,
} from "..";
import {
  extractInputsFromValue,
  generateConfigEditor,
  renderDerivedString,
  replaceInputsInValue,
} from "./improved-macro-utils";

export * from "./improved-macro-utils";

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

export type ImprovedMacroNode<Config = any> =
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
  node: ImprovedMacroNode<Config>
): node is AdvancedMacroNode<Config> {
  return (node as AdvancedMacroNode<Config>).defaultConfig !== undefined;
}

export function processImprovedMacro(node: ImprovedMacroNode): MacroNode<any> {
  const isAdvanced = isAdvancedMacroNode(node);

  const displayName =
    typeof node.displayName === "function"
      ? node.displayName
      : (config: any) =>
          renderDerivedString(node.displayName as string, config);

  const description =
    typeof node.description === "function"
      ? node.description
      : (config: any) =>
          renderDerivedString(node.description as string, config);

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
          displayName: displayName(config),
          description: description(config),
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
          description: description(config),
          displayName: displayName(config),
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
