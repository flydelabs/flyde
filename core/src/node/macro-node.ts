import {
  InternalCodeNode,
  CodeNodeDefinition,
  NodeMetadata,
  CodeNodeInstance,
} from "./node";
import type React from "react";

export function macroConfigurableValue(
  type: MacroConfigurableValue["type"],
  value: MacroConfigurableValue["value"]
): MacroConfigurableValue {
  return { type, value };
}
import {
  CodeNode,
  processImprovedMacro,
} from "../improved-macros/improved-macros";

export type MacroEditorFieldDefinitionType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "select"
  | "longtext"
  | "dynamic"
  | "secret";

// Replace the conditional type with this mapped type
export type MacroConfigurableValueTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  json: any;
  select: string | number;
  dynamic: undefined;
  secret: string;
};

export type MacroConfigurableValue = {
  [K in keyof MacroConfigurableValueTypeMap]: {
    type: K;
    value: MacroConfigurableValueTypeMap[K];
  };
}[keyof MacroConfigurableValueTypeMap];

export type MacroEditorFieldDefinition =
  | StringFieldDefinition
  | NumberFieldDefinition
  | BooleanFieldDefinition
  | JsonFieldDefinition
  | SelectFieldDefinition
  | LongTextFieldDefinition
  | GroupFieldDefinition
  | SecretFieldDefinition;

interface BaseFieldDefinition {
  label: string;
  description?: string;
  configKey: string;
  templateSupport?: boolean;
  typeConfigurable?: boolean;
  aiCompletion?: {
    prompt: string;
    placeholder?: string;
    jsonMode?: boolean;
  };
  /**
   * Optional condition that determines whether this field should be shown.
   * If the condition evaluates to false, the field will be hidden.
   *
   * Uses a string expression like "method !== 'GET'" that will be evaluated against the values.
   * The expression can reference other field values directly by their key.
   *
   * @example
   * condition: "method === 'POST'"
   */
  condition?: string;
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

export interface SecretFieldDefinition extends BaseFieldDefinition {
  type: "secret";
  typeData: SecretTypeData;
}

export interface NumberTypeData {
  min?: number;
  max?: number;
}

export interface SecretTypeData {
  defaultName?: string;
}

export interface SelectTypeData {
  options: { value: string | number; label: string }[];
}

export interface MacroEditorConfigCustom {
  type: "custom";
  editorComponentBundlePath?: string;
  editorComponentBundleContent?: string;
}

export interface MacroEditorConfigStructured {
  type: "structured";
  fields: MacroEditorFieldDefinition[];
}

export type MacroEditorConfigResolved =
  | MacroEditorConfigCustom
  | MacroEditorConfigStructured;
export type MacroEditorConfigDefinition =
  | MacroEditorConfigCustom
  | MacroEditorConfigStructured;

export interface InternalMacroNode<T = any> extends NodeMetadata {
  definitionBuilder: (data: T) => Omit<CodeNodeDefinition, "id" | "namespace">;
  runFnBuilder: (data: T) => InternalCodeNode["run"];
  defaultData: T;

  /**
   * Assumes you are bundling the editor component using webpack library+window config.
   * The name of the window variable that holds the component should be __MacroNode__{id}
   * The path should be relative to the root of the project (package.json location)
   */
  editorConfig: MacroEditorConfigResolved;
}

export type MacroNodeDefinition<T> = Omit<
  InternalMacroNode<T>,
  | "definitionBuilder"
  | "runFnBuilder"
  | "editorComponentBundlePath"
  | "editorConfig"
> & {
  /**
   * Resolver will use this to load the editor component bundle into the editor
   */
  editorConfig: MacroEditorConfigDefinition;
  sourceCode?: string;
};

export interface MacroEditorCompProps<T> {
  value: T;
  onChange: (value: T) => void;
  prompt: (message: string) => Promise<string>;
  createAiCompletion?: (prompt: {
    prompt: string;
    currentValue?: any;
  }) => Promise<string>;
}

export interface MacroEditorComp<T> extends React.FC<MacroEditorCompProps<T>> { }

export const isInternalMacroNode = (p: any): p is InternalMacroNode<any> => {
  return p && typeof (p as InternalMacroNode<any>).runFnBuilder === "function";
};

export function processMacroNodeInstance(
  prefix: string,
  _macro: InternalMacroNode<any> | CodeNode,
  instance: Pick<CodeNodeInstance, "id" | "config">
) {
  const macro = isInternalMacroNode(_macro)
    ? _macro
    : processImprovedMacro(_macro);

  const metaData = macro.definitionBuilder(instance.config ?? {});
  const runFn = macro.runFnBuilder(instance.config ?? {});

  const id = `${prefix}${macro.id}__${instance.id}`;

  const resolvedNode: InternalCodeNode = {
    ...metaData,
    // defaultStyle: metaData.defaultStyle ?? macro.defaultStyle,
    defaultStyle: metaData.defaultStyle ?? macro.defaultStyle,
    displayName: metaData.displayName ?? macro.id,
    namespace: macro.namespace,
    id,
    run: runFn,
  };

  return resolvedNode;
}

export interface GroupFieldDefinition extends BaseFieldDefinition {
  type: "group";
  fields: MacroEditorFieldDefinition[];
  typeData?: {
    /**
     * Whether the group is collapsible
     */
    collapsible?: boolean;
    /**
     * Whether the group is collapsed by default (only applies if collapsible is true)
     */
    defaultCollapsed?: boolean;
  };
}

export function isMacroConfigurableValue(
  value: any
): value is MacroConfigurableValue {
  return typeof value === "object" && value !== null && "type" in value;
}
