import { CodeNode, createInputGroup, nodeOutput } from "@flyde/core";

export const StringOps: CodeNode = {
  id: "StringOps",
  displayName: "String {{operation}}",
  menuDisplayName: "String Operations",
  icon: "font",
  namespace: "Strings",
  description: "Performs various string operations",
  inputs: {
    operation: {
      defaultValue: "toLowerCase",
      label: "Operation",
      description: "The string operation to perform",
      editorType: "select",
      typeConfigurable: false,
      editorTypeData: {
        options: [
          // String transformations
          "toLowerCase",
          "toUpperCase",
          "trim",
          "toCamelCase",
          "toKebabCase",
          "toPascalCase",
          "toSnakeCase",
          "toTitleCase",
          // String creations
          "emptyString",
          "concat",
          // String queries
          "length",
          "isEmpty",
          "includes",
          "startsWith",
          "endsWith",
          "indexOf",
          "lastIndexOf",
          "charAt",
          "matchRegex",
          // String manipulations
          "substring",
          "replace",
          "split",
          "join",
        ],
      },
    },
    // Single string input operations
    singleStringInputs: {
      group: createInputGroup("String Input", ["string"], {
        collapsible: true,
        defaultCollapsed: false,
      }),
      condition:
        "['toLowerCase', 'toUpperCase', 'trim', 'toCamelCase', 'toKebabCase', 'toPascalCase', 'toSnakeCase', 'toTitleCase', 'length', 'isEmpty'].includes(operation)",
    },
    string: {
      description: "String input for the operation",
    },
    // Two string inputs operations
    twoStringInputs: {
      group: createInputGroup("Two String Inputs", ["string", "searchString"], {
        collapsible: true,
        defaultCollapsed: false,
      }),
      condition:
        "['includes', 'startsWith', 'endsWith', 'indexOf', 'lastIndexOf'].includes(operation)",
    },
    searchString: {
      description:
        "Search string for operations like includes, indexOf, startsWith, etc.",
    },
    // Substring operation
    substringInputs: {
      group: createInputGroup("Substring Inputs", ["string", "start", "end"], {
        collapsible: true,
        defaultCollapsed: false,
      }),
      condition: "operation === 'substring'",
    },
    start: {
      editorType: "number",
      description: "Start index for substring operation",
    },
    end: {
      editorType: "number",
      description: "End index for substring operation",
    },
    // Replace operation
    replaceInputs: {
      group: createInputGroup(
        "Replace Inputs",
        ["string", "searchValue", "replaceValue"],
        {
          collapsible: true,
          defaultCollapsed: false,
        }
      ),
      condition: "operation === 'replace'",
    },
    searchValue: {
      description: "String or regex to search for",
    },
    replaceValue: {
      description: "String to replace with",
    },
    // Join operation
    joinInputs: {
      group: createInputGroup("Join Inputs", ["array", "separator"], {
        collapsible: true,
        defaultCollapsed: false,
      }),
      condition: "operation === 'join'",
    },
    array: {
      description: "Array to join",
    },
    separator: {
      description: "Separator string",
      defaultValue: ",",
    },
    // Split operation
    splitInputs: {
      group: createInputGroup("Split Inputs", ["string", "separator"], {
        collapsible: true,
        defaultCollapsed: false,
      }),
      condition: "operation === 'split'",
    },
    // Concat operation
    concatInputs: {
      group: createInputGroup("Concat Inputs", ["string", "strings"], {
        collapsible: true,
        defaultCollapsed: false,
      }),
      condition: "operation === 'concat'",
    },
    strings: {
      description: "Strings to concatenate with the main string",
    },
    // CharAt operation
    charAtInputs: {
      group: createInputGroup("CharAt Inputs", ["string", "index"], {
        collapsible: true,
        defaultCollapsed: false,
      }),
      condition: "operation === 'charAt'",
    },
    index: {
      editorType: "number",
      description: "Index for charAt operation",
    },
    // MatchRegex operation
    matchRegexInputs: {
      group: createInputGroup("MatchRegex Inputs", ["string", "regex"], {
        collapsible: true,
        defaultCollapsed: false,
      }),
      condition: "operation === 'matchRegex'",
    },
    regex: {
      description: "Regular expression to match",
    },
  },
  outputs: {
    value: nodeOutput(),
  },
  run: (inputs, outputs, adv) => {
    const {
      operation,
      string,
      searchString,
      start,
      end,
      searchValue,
      replaceValue,
      array,
      separator,
      strings,
      index,
      regex,
    } = inputs;

    try {
      let result;

      switch (operation) {
        // String transformations
        case "toLowerCase":
          result = string.toLowerCase();
          break;
        case "toUpperCase":
          result = string.toUpperCase();
          break;
        case "trim":
          result = string.trim();
          break;
        case "toCamelCase":
          result = string
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
              if (+match === 0) return "";
              return index === 0 ? match.toLowerCase() : match.toUpperCase();
            })
            .replace(/\s+/g, "");
          break;
        case "toKebabCase":
          result = string
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .replace(/\s+/g, "-")
            .toLowerCase();
          break;
        case "toPascalCase":
          result = string
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match) => {
              if (+match === 0) return "";
              return match.toUpperCase();
            })
            .replace(/\s+/g, "");
          break;
        case "toSnakeCase":
          result = string
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .replace(/\s+/g, "_")
            .toLowerCase();
          break;
        case "toTitleCase":
          result = string.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
          });
          break;

        // String creations
        case "emptyString":
          result = "";
          break;
        case "concat":
          result = string.concat(
            ...(Array.isArray(strings) ? strings : [strings])
          );
          break;

        // String queries
        case "length":
          result = string.length;
          break;
        case "isEmpty":
          result = string.length === 0;
          break;
        case "includes":
          result = string.includes(searchString);
          break;
        case "startsWith":
          result = string.startsWith(searchString);
          break;
        case "endsWith":
          result = string.endsWith(searchString);
          break;
        case "indexOf":
          result = string.indexOf(searchString);
          break;
        case "lastIndexOf":
          result = string.lastIndexOf(searchString);
          break;
        case "charAt":
          result = string.charAt(index);
          break;
        case "matchRegex":
          result = string.match(new RegExp(regex));
          break;

        // String manipulations
        case "substring":
          result = string.substring(start, end);
          break;
        case "replace":
          result =
            typeof searchValue === "string"
              ? string.replace(searchValue, replaceValue)
              : string.replace(new RegExp(searchValue), replaceValue);
          break;
        case "split":
          result = string.split(separator);
          break;
        case "join":
          if (!Array.isArray(array)) {
            throw new Error("Array must be an array");
          }
          result = array.join(separator);
          break;

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      outputs.value.next(result);
    } catch (error) {
      adv.onError(`String operation error: ${(error as Error).message}`);
    }
  },
  aliases: [
    "toLowerCase",
    "toUpperCase",
    "trim",
    "toCamelCase",
    "toKebabCase",
    "toPascalCase",
    "toSnakeCase",
    "toTitleCase",
    "emptyString",
    "concat",
    "length",
    "isEmpty",
    "includes",
    "startsWith",
    "endsWith",
    "indexOf",
    "lastIndexOf",
    "charAt",
    "matchRegex",
    "substring",
    "replace",
    "split",
    "join",
  ],
};
