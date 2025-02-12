import {
  InputPin,
  MacroConfigurableValue,
  MacroEditorFieldDefinition,
  MacroNode,
  nodeInput,
} from "..";

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
  key: string
): Record<string, InputPin> {
  const inputs = {};

  function extractFromValue(value: any) {
    if (typeof value === "string") {
      const matches = value.match(/({{.*?}})/g);
      if (matches) {
        for (const match of matches) {
          const { inputName } = extractInputNameAndPath(match);
          inputs[inputName] = nodeInput();
        }
      }
    }
  }

  if (val.type === "string") {
    extractFromValue(val.value);
  } else if (val.type === "dynamic") {
    return { [key]: nodeInput() };
  } else {
    try {
      const jsonString = JSON.stringify(val.value);
      const matches = jsonString.match(/({{.*?}})/g);
      if (matches) {
        for (const match of matches) {
          const { inputName } = extractInputNameAndPath(match);
          inputs[inputName] = nodeInput();
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
): MacroNode<Config>["editorConfig"] {
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
