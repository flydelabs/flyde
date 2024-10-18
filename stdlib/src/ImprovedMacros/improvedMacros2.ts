import {
  CodeNode,
  MacroConfigurableValue,
  macroConfigurableValue,
  MacroEditorFieldDefinition,
  MacroNode,
} from "@flyde/core";
import { extractInputsFromValue, replaceInputsInValue } from "./improvedMacros";

export interface ImprovedMacroNode2 {
  id: string;
  namespace?: string;
  displayName?: string;
  menuDisplayName?: string;
  description?: string | ((config: Record<string, any>) => string);
  menuDescription?: string;
  icon?: string;
  inputs: Record<string, InputConfig>;
  outputs: Record<
    string,
    {
      description?: string;
    }
  >;
  completionOutputs?: string[];
  run: CodeNode["run"];
}

type InputConfig = {
  defaultValue?: any;
  description?: string;
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

export function improvedMacro2ToOldMacro(
  node: ImprovedMacroNode2
): MacroNode<any> {
  const defaultData = Object.keys(node.inputs).reduce((acc, key) => {
    const input = node.inputs[key];
    const type = inferTypeFromInput(input);
    acc[key] = macroConfigurableValue(type, input.defaultValue ?? `{{${key}}}`);
    return acc;
  }, {} as Record<string, any>);

  console.log({ defaultData });

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
        completionOutputs: node.completionOutputs,
        description:
          typeof node.description === "function"
            ? node.description(config)
            : node.description,
        displayName: node.menuDisplayName,
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
