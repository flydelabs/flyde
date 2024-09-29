import { CodeNode, CodeNodeDefinition, NodeMetadata } from "./node";
import type React from "react";

export type MacroEditorFieldDefinitionType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "select"
  | "longtext"
  | "enum";

export type MacroEditorFieldDefinition =
  | StringFieldDefinition
  | NumberFieldDefinition
  | BooleanFieldDefinition
  | JsonFieldDefinition
  | SelectFieldDefinition
  | LongTextFieldDefinition
  | EnumFieldDefinition;

interface BaseFieldDefinition {
  label: string;
  description?: string;
  configKey: string;
}

interface StringFieldDefinition extends BaseFieldDefinition {
  type: "string";
}

interface BooleanFieldDefinition extends BaseFieldDefinition {
  type: "boolean";
}

interface JsonFieldDefinition extends BaseFieldDefinition {
  type: "json";
}

interface LongTextFieldDefinition extends BaseFieldDefinition {
  type: "longtext";
}

interface NumberFieldDefinition extends BaseFieldDefinition {
  type: "number";
  typeData?: NumberTypeData;
}

interface SelectFieldDefinition extends BaseFieldDefinition {
  type: "select";
  typeData: SelectTypeData;
}

interface EnumFieldDefinition extends BaseFieldDefinition {
  type: "enum";
  typeData: EnumTypeData;
}

export interface NumberTypeData {
  min?: number;
  max?: number;
}

export interface SelectTypeData {
  items: { value: string | number; label: string }[];
}

export interface EnumTypeData {
  options: string[];
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
  definitionBuilder: (data: T) => Omit<CodeNodeDefinition, "id">;
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
}

export interface MacroEditorComp<T> extends React.FC<MacroEditorCompProps<T>> {}

/* helpers, used flow-editor macro editor builder */

export type ConfigurableInputStatic<T> = {
  mode: "static";
  value: T;
};

export type ConfigurableInputDynamic = {
  mode: "dynamic";
};

export type ConfigurableInput<T> =
  | ConfigurableInputStatic<T>
  | ConfigurableInputDynamic;

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
