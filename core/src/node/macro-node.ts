import { CodeNode, CodeNodeDefinition, NodeMetadata } from "./node";
import type React from "react";
import { MacroNodeInstance } from "./node-instance";

export type MacroEditorFieldDefinitionType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "select"
  | "longtext"
  | "dynamic";

// Replace the conditional type with this mapped type
export type MacroConfigurableValueTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  json: any;
  select: string | number;
  dynamic: undefined;
};

export type MacroConfigurableValue = {
  [K in keyof MacroConfigurableValueTypeMap]: {
    type: K;
    value: MacroConfigurableValueTypeMap[K];
  };
}[keyof MacroConfigurableValueTypeMap];

export function macroConfigurableValue(
  type: MacroConfigurableValue["type"],
  value: MacroConfigurableValue["value"]
): MacroConfigurableValue {
  return { type, value };
}

export type MacroEditorFieldDefinition =
  | StringFieldDefinition
  | NumberFieldDefinition
  | BooleanFieldDefinition
  | JsonFieldDefinition
  | SelectFieldDefinition
  | LongTextFieldDefinition;

interface BaseFieldDefinition {
  label: string;
  description?: string;
  configKey: string;
  templateSupport?: boolean;
  typeConfigurable?: boolean;
}

export interface StringFieldDefinition extends BaseFieldDefinition {
  type: "string";
}

export interface BooleanFieldDefinition extends BaseFieldDefinition {
  type: "boolean";
}

export interface JsonFieldDefinition extends BaseFieldDefinition {
  type: "json";
  typeData?: {
    helperText?: string;
  };
}

export interface LongTextFieldDefinition extends BaseFieldDefinition {
  type: "longtext";
  typeData?: {
    rows?: number;
  };
}

export interface NumberFieldDefinition extends BaseFieldDefinition {
  type: "number";
  typeData?: NumberTypeData;
}

export interface SelectFieldDefinition extends BaseFieldDefinition {
  type: "select";
  typeData: SelectTypeData;
}

export interface NumberTypeData {
  min?: number;
  max?: number;
}

export interface SelectTypeData {
  options: { value: string | number; label: string }[];
}

export interface MacroEditorConfigCustomResolved {
  type: "custom";
  editorComponentBundlePath: string;
}

export interface MacroEditorConfigCustomDefinition {
  type: "custom";
  editorComponentBundleContent: string;
}

export interface MacroEditorConfigStructured {
  type: "structured";
  fields: MacroEditorFieldDefinition[];
}

export type MacroEditorConfigResolved =
  | MacroEditorConfigCustomResolved
  | MacroEditorConfigStructured;
export type MacroEditorConfigDefinition =
  | MacroEditorConfigCustomDefinition
  | MacroEditorConfigStructured;

export interface MacroNode<T> extends NodeMetadata {
  definitionBuilder: (data: T) => Omit<CodeNodeDefinition, "id" | "namespace">;
  runFnBuilder: (data: T) => CodeNode["run"];
  defaultData: T;

  /**
   * Assumes you are bundling the editor component using webpack library+window config.
   * The name of the window variable that holds the component should be __MacroNode__{id}
   * The path should be relative to the root of the project (package.json location)
   */
  editorConfig: MacroEditorConfigResolved;
}

export type MacroNodeDefinition<T> = Omit<
  MacroNode<T>,
  | "definitionBuilder"
  | "runFnBuilder"
  | "editorComponentBundlePath"
  | "editorConfig"
> & {
  /**
   * Resolver will use this to load the editor component bundle into the editor
   */
  editorConfig: MacroEditorConfigDefinition;
};

export interface MacroEditorCompProps<T> {
  value: T;
  onChange: (value: T) => void;
  prompt: (message: string) => Promise<string>;
}

export interface MacroEditorComp<T> extends React.FC<MacroEditorCompProps<T>> {}

export const isMacroNode = (p: any): p is MacroNode<any> => {
  return p && typeof (p as MacroNode<any>).runFnBuilder === "function";
};

export const isMacroNodeDefinition = (
  p: any
): p is MacroNodeDefinition<any> => {
  const { editorConfig } = (p ?? {}) as MacroNodeDefinition<any>;
  if (editorConfig?.type === "custom") {
    return (
      typeof (editorConfig as MacroEditorConfigCustomDefinition)
        .editorComponentBundleContent === "string"
    );
  } else {
    return editorConfig?.type === "structured";
  }
};

export function processMacroNodeInstance(
  prefix: string,
  macro: MacroNode<any>,
  instance: MacroNodeInstance
) {
  const metaData = macro.definitionBuilder(instance.macroData);
  const runFn = macro.runFnBuilder(instance.macroData);

  const id = `${prefix}${macro.id}__${instance.id}`;

  const resolvedNode: CodeNode = {
    ...metaData,
    defaultStyle: metaData.defaultStyle ?? macro.defaultStyle,
    displayName: metaData.displayName ?? macro.id,
    namespace: macro.namespace,
    id,
    run: runFn,
  };

  return resolvedNode;
}
