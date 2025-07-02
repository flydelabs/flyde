import {
  InternalCodeNode,
  CodeNodeDefinition,
  NodeMetadata,
  CodeNodeInstance,
} from "./node";
import type React from "react";

export function configurableValue(
  type: ConfigurableValue["type"],
  value: ConfigurableValue["value"]
): ConfigurableValue {
  return { type, value };
}
import {
  CodeNode,
  processConfigurableNode,
} from "../configurable-nodes/configurable-nodes";

export type ConfigurableFieldDefinitionType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "select"
  | "longtext"
  | "dynamic"
  | "secret";

// Replace the conditional type with this mapped type
export type ConfigurableValueTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  json: any;
  select: string | number;
  dynamic: undefined;
  secret: string;
};

export type ConfigurableValue = {
  [K in keyof ConfigurableValueTypeMap]: {
    type: K;
    value: ConfigurableValueTypeMap[K];
  };
}[keyof ConfigurableValueTypeMap];

export type ConfigurableFieldDefinition =
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

export interface ConfigurableEditorConfigCustom {
  type: "custom";
  editorComponentBundlePath?: string;
  editorComponentBundleContent?: string;
}

export interface ConfigurableEditorConfigStructured {
  type: "structured";
  fields: ConfigurableFieldDefinition[];
}

export type ConfigurableEditorConfigResolved =
  | ConfigurableEditorConfigCustom
  | ConfigurableEditorConfigStructured;
export type ConfigurableEditorConfigDefinition =
  | ConfigurableEditorConfigCustom
  | ConfigurableEditorConfigStructured;

export interface InternalMacroNode<T = any> extends NodeMetadata {
  definitionBuilder: (data: T) => Omit<CodeNodeDefinition, "id" | "namespace">;
  runFnBuilder: (data: T) => InternalCodeNode["run"];
  defaultData: T;

  /**
   * Assumes you are bundling the editor component using webpack library+window config.
   * The name of the window variable that holds the component should be __MacroNode__{id}
   * The path should be relative to the root of the project (package.json location)
   */
  editorConfig: ConfigurableEditorConfigResolved;
}

export type ConfigurableNodeDefinition<T> = Omit<
  InternalMacroNode<T>,
  | "definitionBuilder"
  | "runFnBuilder"
  | "editorComponentBundlePath"
  | "editorConfig"
> & {
  /**
   * Resolver will use this to load the editor component bundle into the editor
   */
  editorConfig: ConfigurableEditorConfigDefinition;
  sourceCode?: string;
};

// copied from flow-editor/ports.ts TODO - merge
export interface AiCompletionDto { prompt: string; nodeId: string; insId: string; jsonMode?: boolean; };

export interface PartialEditorPorts {
  getAvailableSecrets: () => Promise<string[]>;
  addNewSecret: (dto: { key: string; value: string }) => Promise<string[]>;
  prompt: ({ text, defaultValue }: { text: string; defaultValue?: string }) => Promise<string | null>;
  createAiCompletion?: (dto: AiCompletionDto) => Promise<string>;
}

export interface ConfigurableEditorCompProps<T> {
  value: T;
  onChange: (value: T) => void;
  ports: PartialEditorPorts;
  insId?: string;
  nodeId: string;
  createAiCompletion?: PartialEditorPorts['createAiCompletion'];
}

export interface ConfigurableEditorComp<T> extends React.FC<ConfigurableEditorCompProps<T>> { }

export const isInternalMacroNode = (p: any): p is InternalMacroNode<any> => {
  return p && typeof (p as InternalMacroNode<any>).runFnBuilder === "function";
};

export function processConfigurableNodeInstance(
  prefix: string,
  _macro: InternalMacroNode<any> | CodeNode,
  instance: Pick<CodeNodeInstance, "id" | "config">,
  secrets: Record<string, string> = {},
) {
  const macro = isInternalMacroNode(_macro)
    ? _macro
    : processConfigurableNode(_macro, secrets);

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
  fields: ConfigurableFieldDefinition[];
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

export function isConfigurableValue(
  value: any
): value is ConfigurableValue {
  return typeof value === "object" && value !== null && "type" in value;
}
