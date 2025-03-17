import {
  InputPin,
  MacroConfigurableValue,
  MacroEditorFieldDefinition,
  InternalMacroNode,
  InputMode,
} from "..";

import { nodeInput } from "../node";

// Import the InputConfig type from improved-macros
import { InputConfig } from "./improved-macros";

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
  key: string,
  mode?: InputMode
): Record<string, InputPin> {
  const inputs = {};

  function extractFromValue(value: any) {
    if (typeof value === "string") {
      const matches = value.match(/({{.*?}})/g);
      if (matches) {
        for (const match of matches) {
          const { inputName } = extractInputNameAndPath(match);
          inputs[inputName] = nodeInput(mode);
        }
      }
    }
  }

  if (val.type === "string") {
    extractFromValue(val.value);
  } else if (val.type === "dynamic") {
    return { [key]: nodeInput(mode) };
  } else {
    try {
      const jsonString = JSON.stringify(val.value);
      const matches = jsonString.match(/({{.*?}})/g);
      if (matches) {
        for (const match of matches) {
          const { inputName } = extractInputNameAndPath(match);
          inputs[inputName] = nodeInput(mode);
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
  value: MacroConfigurableValue,
  fieldName: string,
  ignoreMissingInputs: boolean = true
): MacroConfigurableValue["value"] {
  if (value.type === "string") {
    return value.value.replace(/({{.*?}})/g, (match) => {
      const { inputName, path } = extractInputNameAndPath(match);
      let result = inputs[inputName];
      for (const key of path) {
        if (result && typeof result === "object" && key in result) {
          result = result[key];
        } else {
          return ignoreMissingInputs ? match : "";
        }
      }
      return result !== undefined ? result : match;
    });
  }

  if (value.type === "dynamic") {
    return inputs[fieldName];
  }

  if (value.type === "json") {
    let parsed =
      typeof value.value === "string" ? JSON.parse(value.value) : value.value;

    function replaceInObject(obj: any): any {
      if (typeof obj === "string") {
        return obj.replace(/({{.*?}})/g, (match) => {
          const { inputName, path } = extractInputNameAndPath(match);
          let result = inputs[inputName];
          for (const key of path) {
            if (result && typeof result === "object" && key in result) {
              result = result[key];
            } else {
              return match;
            }
          }
          return result !== undefined ? result : match;
        });
      }

      if (Array.isArray(obj)) {
        return obj.map((item) => replaceInObject(item));
      }

      if (obj && typeof obj === "object") {
        const result = {};
        for (const key in obj) {
          const value = obj[key];
          if (typeof value === "string" && value.trim().match(/^{{.*}}$/)) {
            const { inputName, path } = extractInputNameAndPath(value.trim());
            let replacementValue = inputs[inputName];
            for (const pathKey of path) {
              if (
                replacementValue &&
                typeof replacementValue === "object" &&
                pathKey in replacementValue
              ) {
                replacementValue = replacementValue[pathKey];
              }
            }
            result[key] =
              replacementValue !== undefined ? replacementValue : value;
          } else {
            result[key] = replaceInObject(value);
          }
        }
        return result;
      }

      return obj;
    }

    return replaceInObject(parsed);
  }

  return value.value;
}

export function renderConfigurableValue(
  value: MacroConfigurableValue,
  fieldName: string
) {
  if (value.type === "dynamic") {
    return `{{${fieldName}}}`;
  } else return `${value.value}`;
}

export function generateConfigEditor<Config>(
  config: Config,
  overrides?: Partial<Record<keyof Config, any>>
): InternalMacroNode<Config>["editorConfig"] {
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
      description: override?.description,
    };
  });

  return {
    type: "structured",
    fields: fields as MacroEditorFieldDefinition[],
  };
}

export function renderDerivedString(displayName: string, config: any) {
  const string = displayName?.replace(/{{.*?}}/g, (match) => {
    const { inputName } = extractInputNameAndPath(match);
    const value = config[inputName];
    const isMacroConfigurableValue =
      value && typeof value === "object" && "type" in value && "value" in value;
    if (isMacroConfigurableValue) {
      if (value.type === "dynamic") {
        return match;
      } else {
        return value.value;
      }
    }
    return match;
  });

  // Format time values in the final string
  return string?.replace(/(\d+)ms/g, (match, p1) => {
    const num = parseInt(p1, 10);
    if (num >= 1000) {
      return num / 1000 + "s";
    }
    return match;
  });
}

/**
 * Evaluates a string condition against a configuration object.
 *
 * @param condition The string expression to evaluate
 * @param config The configuration object to evaluate against
 * @returns True if the condition is met, false otherwise
 */
export function evaluateCondition(
  condition: string | undefined,
  config: Record<string, any>
): boolean {
  if (!condition) {
    return true;
  }

  const context: Record<string, any> = {};

  Object.entries(config).forEach(([key, value]) => {
    if (
      value &&
      typeof value === "object" &&
      "type" in value &&
      "value" in value
    ) {
      context[key] = value.value;
    } else {
      context[key] = value;
    }
  });

  try {
    const evaluator = new Function(
      ...Object.keys(context),
      `return ${condition};`
    );
    return Boolean(evaluator(...Object.values(context)));
  } catch (error) {
    console.error(`Error evaluating condition "${condition}":`, error);
    return true;
  }
}

/**
 * Evaluates whether a field in a group hierarchy should be visible.
 * A field is visible only if all its parent groups are visible.
 *
 * @param field The field to check visibility for
 * @param fieldPath Array of parent group field IDs leading to this field
 * @param allFields Map of all fields by their ID
 * @param config The configuration object to evaluate conditions against
 * @returns True if the field should be visible, false otherwise
 */
export function evaluateFieldVisibility(
  fieldKey: string,
  groupHierarchy: string[],
  allFields: Record<string, MacroEditorFieldDefinition>,
  config: Record<string, any>
): boolean {
  // Check if the field itself has a condition
  const field = allFields[fieldKey];
  if (!field) {
    return false;
  }

  // First check if the field itself is visible based on its condition
  const fieldVisible = evaluateCondition(field.condition, config);
  if (!fieldVisible) {
    return false;
  }

  // Then check if all parent groups are visible
  for (const groupKey of groupHierarchy) {
    const group = allFields[groupKey];
    if (!group || !evaluateCondition(group.condition, config)) {
      return false;
    }
  }

  return true;
}

/**
 * Creates a group configuration for use in InputConfig.
 *
 * @param title The title of the group
 * @param fields Array of field keys to include in the group
 * @param options Additional group options
 * @returns A group configuration object
 */
export function createInputGroup(
  title: string,
  fields: string[],
  options?: {
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    parentGroup?: string;
    condition?: string;
  }
): NonNullable<InputConfig["group"]> & { condition?: string } {
  return {
    title,
    fields,
    collapsible: options?.collapsible,
    defaultCollapsed: options?.defaultCollapsed,
    parentGroup: options?.parentGroup,
    condition: options?.condition,
  };
}
