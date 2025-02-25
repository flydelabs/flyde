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

export type InputConfig = {
  defaultValue?: any;
  /**
   * The label displayed above the input field.
   * If not provided, the description will be used as the label.
   * @recommended
   */
  label?: string;
  description?: string;
  mode?: InputMode | "reactive";
  /**
   * Whether the type of this input can be changed in the editor.
   * When false, the "Change type" button will not be shown and the input won't be exposed as an input pin.
   * @default true
   */
  typeConfigurable?: boolean;
  aiCompletion?: {
    prompt: string;
    placeholder?: string;
    jsonMode?: boolean;
  };
  /**
   * Optional condition that determines whether this input should be shown.
   * If the condition evaluates to false, the input will be hidden.
   *
   * Uses a string expression like "method !== 'GET'" that will be evaluated against the config.
   * The expression can reference other field values directly by their key.
   *
   * @example
   * condition: "method !== 'GET'"
   */
  condition?: string;
  /**
   * Optional group configuration for organizing inputs.
   * When specified, this input will be treated as a group container.
   */
  group?: {
    /**
     * The title of the group
     */
    title: string;
    /**
     * Whether the group is collapsible
     */
    collapsible?: boolean;
    /**
     * Whether the group is collapsed by default (only applies if collapsible is true)
     */
    defaultCollapsed?: boolean;
    /**
     * Fields to include in this group.
     * Can include both regular field keys and other group keys for nested groups.
     */
    fields: string[];
    /**
     * Optional parent group key. When specified, this group will be nested inside the parent group.
     * If not specified, the group will be at the top level.
     */
    parentGroup?: string;
  };
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
    // First, identify all group containers
    const groupContainers = Object.entries(node.inputs)
      .filter(([_, input]) => input.group)
      .reduce((acc, [key, input]) => {
        acc[key] = input.group!;
        return acc;
      }, {} as Record<string, NonNullable<InputConfig["group"]>>);

    // Only create defaultData for actual input fields, not group containers
    const defaultData = Object.entries(node.inputs)
      .filter(([key]) => !groupContainers[key]) // Filter out group container keys
      .reduce((acc, [key, input]) => {
        const type = inferTypeFromInput(input);
        // For non-configurable inputs or inputs with typeConfigurable: false, store the actual value, not a configurable value
        if (input.typeConfigurable === false) {
          acc[key] = input.defaultValue;
        } else {
          acc[key] = macroConfigurableValue(
            type,
            input.defaultValue ?? `{{${key}}}`
          );
        }
        return acc;
      }, {} as Record<string, any>);

    // Build a map of parent groups to their child groups
    const groupHierarchy: Record<string, string[]> = {};

    // Initialize with empty arrays for all groups
    Object.keys(groupContainers).forEach((key) => {
      groupHierarchy[key] = [];
    });

    // Add a root entry for top-level groups
    groupHierarchy["root"] = [];

    // Populate the hierarchy
    Object.entries(groupContainers).forEach(([key, group]) => {
      const parentKey = group.parentGroup || "root";
      if (parentKey !== key) {
        // Prevent circular references
        if (!groupHierarchy[parentKey]) {
          groupHierarchy[parentKey] = [];
        }
        groupHierarchy[parentKey].push(key);
      }
    });

    // Track which fields are already in groups to avoid duplication
    const fieldsInGroups = new Set<string>();

    // Collect all fields in all groups
    Object.values(groupContainers).forEach((group) => {
      group.fields.forEach((field) => {
        // Only add if it's not a group itself, or if it is a group but not a child of this group
        if (
          !groupContainers[field] ||
          groupContainers[field].parentGroup !== group.parentGroup
        ) {
          fieldsInGroups.add(field);
        }
      });
    });

    // Create field definitions for all inputs, including groups
    const allFieldDefinitions = Object.keys(node.inputs).map((key) => {
      const input = node.inputs[key];
      const type = input.editorType ?? inferTypeFromInput(input);

      // If no label is provided, use the description or the key
      const label =
        input.label ||
        input.description ||
        key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());

      // Only use description for explanatory text if it's different from the label
      const description =
        input.description !== label ? input.description : undefined;

      // If this is a group container, create a group field definition
      if (input.group) {
        return {
          type: "group" as const,
          configKey: key,
          label: input.group.title || label,
          description,
          condition: input.condition,
          typeData: {
            collapsible: input.group.collapsible,
            defaultCollapsed: input.group.defaultCollapsed,
          },
          // We'll populate this with actual field definitions later
          fields: [],
        };
      }

      return {
        type,
        configKey: key,
        typeData: input.editorTypeData,
        label,
        description,
        aiCompletion: input.aiCompletion,
        condition: input.condition,
        // Pass through typeConfigurable
        typeConfigurable: input.typeConfigurable,
      } as MacroEditorFieldDefinition;
    });

    // Create a map of field definitions by key for easy lookup
    const fieldDefinitionsMap = allFieldDefinitions.reduce((acc, field) => {
      acc[field.configKey] = field;
      return acc;
    }, {} as Record<string, MacroEditorFieldDefinition>);

    // Function to recursively build group fields
    function buildGroupFields(groupKey: string): MacroEditorFieldDefinition[] {
      const group = groupContainers[groupKey];
      const childGroups = groupHierarchy[groupKey] || [];

      // Get direct field children (excluding child groups)
      const directFields = group.fields
        .filter((fieldKey) => !childGroups.includes(fieldKey))
        .map((fieldKey) => fieldDefinitionsMap[fieldKey])
        .filter(Boolean);

      // Get child groups
      const childGroupFields = childGroups
        .map((childGroupKey) => {
          const childGroupField = fieldDefinitionsMap[childGroupKey] as any;
          if (childGroupField) {
            // Recursively build fields for this child group
            childGroupField.fields = buildGroupFields(childGroupKey);
          }
          return childGroupField;
        })
        .filter(Boolean);

      // Combine direct fields and child group fields
      return [...directFields, ...childGroupFields];
    }

    // Populate group fields with their field definitions
    Object.entries(groupContainers)
      .filter(([_, group]) => !group.parentGroup) // Start with top-level groups
      .forEach(([groupKey, _]) => {
        const groupField = fieldDefinitionsMap[groupKey] as any;
        groupField.fields = buildGroupFields(groupKey);
      });

    // Final editor fields should only include top-level fields (not in any group)
    const editorFields = allFieldDefinitions.filter(
      (field) => !fieldsInGroups.has(field.configKey)
    );

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
            // Skip non-configurable inputs when creating input pins
            if (node.inputs[key]?.typeConfigurable === false) {
              return acc;
            }
            // Skip group containers when creating input pins
            if (groupContainers[key]) {
              return acc;
            }
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
          reactiveInputs: Object.keys(node.inputs)
            .filter((key) => !groupContainers[key]) // Filter out group container keys
            .filter((key) => node.inputs[key].mode === "reactive"),
          description: description(config),
          displayName: displayName(config),
        };
      },
      runFnBuilder: (config) => {
        return (inputs, outputs, adv) => {
          const inputValues = Object.keys(config).reduce((acc, key) => {
            // For non-configurable inputs, use the raw value directly
            if (node.inputs[key]?.typeConfigurable === false) {
              acc[key] = config[key];
            } else {
              acc[key] = replaceInputsInValue(inputs, config[key], key);
            }
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
