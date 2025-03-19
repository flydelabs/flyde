import {
  InternalCodeNode,
  InputPin,
  OutputPin,
  InternalMacroNode,
  NodeStyle,
  InputMode,
  MacroConfigurableValue,
  MacroEditorFieldDefinition,
} from "..";
import {
  extractInputsFromValue,
  generateConfigEditor,
  renderDerivedString,
  replaceInputsInValue,
  evaluateFieldVisibility,
} from "./improved-macro-utils";

export * from "./improved-macro-utils";

import {
  isMacroConfigurableValue,
  macroConfigurableValue,
} from "../node/macro-node";

export type StaticOrDerived<T, Config> = T | ((config: Config) => T);

export interface BaseMacroNodeData<Config = any> {
  mode?: "simple" | "advanced";
  id: string;
  namespace?: string;
  menuDisplayName?: string;
  menuDescription?: string;
  displayName?: StaticOrDerived<string, Config>;
  description?: StaticOrDerived<string, Config>;
  overrideNodeBodyHtml?: StaticOrDerived<string, Config>;
  aliases?: string[];
  icon?: string;

  completionOutputs?: StaticOrDerived<string[], Config>;
  run: InternalCodeNode["run"];
}

export interface SimpleCodeNode<Config> extends BaseMacroNodeData<Config> {
  inputs: Record<string, InputConfig>;
  outputs: Record<
    string,
    {
      description?: string;
    }
  >;
}

export interface AdvancedCodeNode<Config> extends BaseMacroNodeData<Config> {
  mode: "advanced";
  inputs: StaticOrDerived<Record<string, InputPin>, Config>;
  outputs: StaticOrDerived<Record<string, OutputPin>, Config>;
  reactiveInputs?: StaticOrDerived<string[], Config>;
  defaultConfig: Config;
  editorConfig?: InternalMacroNode<Config>["editorConfig"];
  defaultStyle?: NodeStyle;
}

export type CodeNode<Config = any> =
  | SimpleCodeNode<Config>
  | AdvancedCodeNode<Config>;

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

export function isAdvancedCodeNode<Config>(
  node: CodeNode<Config>
): node is AdvancedCodeNode<Config> {
  return (node as AdvancedCodeNode<Config>).defaultConfig !== undefined;
}

export function isSimplifiedCodeNode<Config>(
  node: CodeNode<Config>
): node is SimpleCodeNode<Config> {
  return (
    (node as SimpleCodeNode<Config>).inputs !== undefined &&
    (node as SimpleCodeNode<Config>).outputs !== undefined &&
    (node as SimpleCodeNode<Config>).run !== undefined
  );
}

export function isCodeNode<Config>(node: any): node is CodeNode<Config> {
  return isAdvancedCodeNode(node) || isSimplifiedCodeNode(node);
}

export function processImprovedMacro(node: CodeNode): InternalMacroNode<any> {
  const isAdvanced = isAdvancedCodeNode(node);

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
          overrideNodeBodyHtml:
            typeof node.overrideNodeBodyHtml === "function"
              ? node.overrideNodeBodyHtml(config)
              : node.overrideNodeBodyHtml,
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
    const groupContainers = Object.entries(node.inputs)
      .filter(([_, input]) => input.group)
      .reduce((acc, [key, input]) => {
        acc[key] = input.group!;
        return acc;
      }, {} as Record<string, NonNullable<InputConfig["group"]>>);

    const defaultData = Object.entries(node.inputs)
      .filter(([key]) => !groupContainers[key]) // Filter out group container keys
      .reduce((acc, [key, input]) => {
        const type = inferTypeFromInput(input);

        acc[key] = macroConfigurableValue(
          type,
          input.defaultValue ?? `{{${key}}}`
        );

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

    const allFieldDefinitions = Object.keys(node.inputs).map((key) => {
      const input = node.inputs[key];
      const type = input.editorType ?? inferTypeFromInput(input);

      const label =
        input.label ||
        input.description ||
        key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());

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
        const fieldToGroupHierarchy: Record<string, string[]> = {};

        function buildGroupHierarchy(fieldKey: string): string[] {
          const containingGroups = Object.entries(groupContainers)
            .filter(([_, group]) => group.fields.includes(fieldKey))
            .map(([groupKey, _]) => groupKey);

          if (containingGroups.length === 0) {
            return [];
          }

          const groupKey = containingGroups[0];
          const group = groupContainers[groupKey];

          const hierarchy = group.parentGroup
            ? [...buildGroupHierarchy(group.parentGroup), group.parentGroup]
            : [];

          // Add the current group
          hierarchy.push(groupKey);

          return hierarchy;
        }

        // Build hierarchies for all fields
        Object.keys(node.inputs)
          .filter((key) => !groupContainers[key]) // Skip group containers
          .forEach((key) => {
            fieldToGroupHierarchy[key] = buildGroupHierarchy(key);
          });

        return {
          inputs: Object.keys(node.inputs).reduce((acc, key) => {
            if (node.inputs[key]?.typeConfigurable === false) {
              return acc;
            }
            // Skip group containers when creating input pins
            if (groupContainers[key]) {
              return acc;
            }

            // Check if the field should be visible based on its condition and group hierarchy
            const isVisible = evaluateFieldVisibility(
              key,
              fieldToGroupHierarchy[key] || [],
              fieldDefinitionsMap,
              config
            );

            if (!isVisible) {
              return acc;
            }

            let configValue = config[key];
            if (!isMacroConfigurableValue(configValue)) {
              console.warn(
                `Config value ${key} isn't a valid MacroConfigurableValue, converting to dynamic`
              );
              configValue = macroConfigurableValue("dynamic", configValue);
            }

            return {
              ...acc,
              ...extractInputsFromValue(
                config[key],
                key,
                node.inputs[key].mode === "reactive"
                  ? undefined
                  : node.inputs[key].mode
              ),
            };
          }, {}),
          outputs: node.outputs,
          completionOutputs:
            typeof node.completionOutputs === "function"
              ? node.completionOutputs(config)
              : node.completionOutputs,
          reactiveInputs: Object.keys(node.inputs)
            .filter((key) => !groupContainers[key]) // Filter out group container keys
            .filter(
              (key) =>
                node.inputs[key].mode === "reactive" ||
                (node as InternalCodeNode).reactiveInputs?.includes(key)
            )
            .filter((key) => {
              // Check if the field should be visible based on its condition and group hierarchy
              return evaluateFieldVisibility(
                key,
                fieldToGroupHierarchy[key] || [],
                fieldDefinitionsMap,
                config
              );
            }),
          description: description(config),
          displayName: displayName(config),
        };
      },
      runFnBuilder: (config) => {
        return (inputs, outputs, adv) => {
          const inputValues = Object.keys(node.inputs).reduce((acc, key) => {
            acc[key] = replaceInputsInValue(
              inputs,
              config[key] ?? macroConfigurableValue("dynamic", `{{${key}}}`),
              key
            );
            return acc;
          }, {} as Record<string, any>);

          console.log("inputValues", inputValues, config);
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
