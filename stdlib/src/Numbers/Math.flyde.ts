import { CodeNode, createInputGroup, nodeOutput } from "@flyde/core";

export const MathNode: CodeNode = {
  id: "Math",
  displayName: "Math {{operation}}",
  menuDisplayName: "Math Operations",
  icon: "calculator",
  namespace: "Numbers",
  description: "Performs various mathematical operations",
  inputs: {
    operation: {
      defaultValue: "add",
      label: "Operation",
      description: "The math operation to perform",
      editorType: "select",
      typeConfigurable: false,
      editorTypeData: {
        options: [
          // Binary operations
          "add",
          "subtract",
          "multiply",
          "divide",
          "modulo",
          "greaterThan",
          "greaterThanOrEqual",
          "lessThan",
          "lessThanOrEqual",
          // Unary operations
          "abs",
          "ceiling",
          "floor",
          "round",
          "truncate",
          "sin",
          "cos",
          "sqrt",
          "parseInt",
          "parseFloat",
        ],
      },
    },
    // Binary operation inputs
    binaryInputs: {
      group: createInputGroup("Binary Inputs", ["n1", "n2"], {
        collapsible: true,
        defaultCollapsed: false,
      }),
      condition:
        "['add', 'subtract', 'multiply', 'divide', 'modulo', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'].includes(operation)",
    },
    n1: {
      editorType: "number",
      description: "First number operand",
    },
    n2: {
      editorType: "number",
      description: "Second number operand",
    },
    // Unary operation inputs
    unaryInputs: {
      group: createInputGroup("Unary Inputs", ["n"], {
        collapsible: true,
        defaultCollapsed: false,
      }),
      condition:
        "['abs', 'ceiling', 'floor', 'round', 'truncate', 'sin', 'cos', 'sqrt', 'parseInt', 'parseFloat'].includes(operation)",
    },
    n: {
      editorType: "number",
      description: "Number for unary operations",
    },
  },
  outputs: {
    result: nodeOutput(),
  },
  run: (inputs, outputs, adv) => {
    const { operation, n1, n2, list, n } = inputs;

    try {
      let result;

      switch (operation) {
        // Binary operations
        case "add":
          result = n1 + n2;
          break;
        case "subtract":
          result = n1 - n2;
          break;
        case "multiply":
          result = n1 * n2;
          break;
        case "divide":
          if (n2 === 0) {
            throw new Error("Division by zero");
          }
          result = n1 / n2;
          break;
        case "modulo":
          result = n1 % n2;
          break;
        case "greaterThan":
          result = n1 > n2;
          break;
        case "greaterThanOrEqual":
          result = n1 >= n2;
          break;
        case "lessThan":
          result = n1 < n2;
          break;
        case "lessThanOrEqual":
          result = n1 <= n2;
          break;

        // Unary operations
        case "abs":
          result = Math.abs(n);
          break;
        case "ceiling":
          result = Math.ceil(n);
          break;
        case "floor":
          result = Math.floor(n);
          break;
        case "round":
          result = Math.round(n);
          break;
        case "truncate":
          result = Math.trunc(n);
          break;
        case "sin":
          result = Math.sin(n);
          break;
        case "cos":
          result = Math.cos(n);
          break;
        case "sqrt":
          if (n < 0) {
            throw new Error("Cannot calculate square root of negative number");
          }
          result = Math.sqrt(n);
          break;
        case "parseInt":
          result = parseInt(String(n), 10);
          break;
        case "parseFloat":
          result = parseFloat(String(n));
          break;

        // List operations
        case "sumList":
          if (!Array.isArray(list)) {
            throw new Error("List must be an array");
          }
          result = list.reduce((acc, curr) => acc + curr, 0);
          break;
        case "min":
          if (!Array.isArray(list) || list.length === 0) {
            throw new Error("List must be a non-empty array");
          }
          result = Math.min(...list);
          break;
        case "max":
          if (!Array.isArray(list) || list.length === 0) {
            throw new Error("List must be a non-empty array");
          }
          result = Math.max(...list);
          break;

        default:
          throw new Error(
            `Unsupported operation: ${JSON.stringify({ operation, n1, n2, n })}`
          );
      }

      outputs.result.next(result);
    } catch (error) {
      adv.onError(`Math operation error: ${(error as Error).message}`);
    }
  },
  aliases: [
    "add",
    "subtract",
    "multiply",
    "divide",
    "modulo",
    "greaterThan",
    "greaterThanOrEqual",
    "lessThan",
    "lessThanOrEqual",
    "abs",
    "ceiling",
    "floor",
    "round",
    "truncate",
    "sin",
    "cos",
    "sqrt",
    "parseInt",
    "parseFloat",
    "sumList",
    "min",
    "max",
  ],
};
