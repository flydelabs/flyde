import { CodeNode, nodeOutput } from "@flyde/core";

export const DateOps: CodeNode = {
  id: "DateOps",
  displayName: "Date {{operation}}",
  menuDisplayName: "Date Operations",
  icon: "calendar",
  namespace: "Dates",
  description: "Performs various date operations",
  inputs: {
    operation: {
      defaultValue: "now",
      label: "Operation",
      description: "The date operation to perform",
      editorType: "select",
      typeConfigurable: false,
      editorTypeData: {
        options: ["now", "nowString", "nowISOString", "nowUnixTime"],
      },
    },
  },
  outputs: {
    value: nodeOutput(),
  },
  run: (inputs, outputs, adv) => {
    const { operation } = inputs;

    try {
      let result;

      switch (operation) {
        case "now":
          result = new Date();
          break;
        case "nowString":
          result = new Date().toString();
          break;
        case "nowISOString":
          result = new Date().toISOString();
          break;
        case "nowUnixTime":
          result = new Date().getTime();
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      outputs.value.next(result);
    } catch (error) {
      console.error("Error in DateOps:", error);
      adv.onError(error);
    }
  },
};
