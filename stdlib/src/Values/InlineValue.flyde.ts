import { MacroNode } from "@flyde/core";
import { getVariables } from "./getInlineVariables";

export interface InlineValueConfig {
  type: "string" | "boolean" | "number" | "json" | "expression";
  value: string;
}

export const InlineValue: MacroNode<InlineValueConfig> = {
  id: "InlineValue",
  displayName: "Inline Value",
  description: "A static value or JS expression",
  runFnBuilder: (config) => {
    return (inputs, outputs, adv) => {
      if (config.type === "expression") {
        try {
          const resFn = eval(`(inputs) => ${config.value}`);
          outputs.value.next(resFn(inputs));
        } catch (e) {
          adv.onError(e);
        }
      } else {
        outputs.value.next(config.value);
      }
    };
  },
  definitionBuilder: (config) => {
    const inputNames =
      config.type === "expression" ? getVariables(config.value) : [];
    return {
      defaultStyle: {
        size: "small",
        icon: "code",
      },
      displayName: "Inline Value",
      description: "A static value or JS expression",
      inputs: Object.fromEntries(inputNames.map((input) => [input, {}]) ?? []),
      outputs: {
        value: {
          displayName: "Value",
          description: "Emits the value configured",
        },
      },
    };
  },
  defaultData: {
    type: "string",
    value: "",
  },
  editorComponentBundlePath: "../../../dist/ui/InlineValue.js",
};
