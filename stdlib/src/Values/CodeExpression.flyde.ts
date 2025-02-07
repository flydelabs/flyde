import { MacroNode } from "@flyde/core";
import { getVariables } from "./getInlineVariables";

export interface CodeExpressionConfig {
  value: string;
}

export const CodeExpression: MacroNode<CodeExpressionConfig> = {
  id: "CodeExpression",
  displayName: "JS Expression",
  defaultStyle: {
    icon: "code",
  },
  description: "Evaluates a JS expression. Supports dynamic variables",

  runFnBuilder: (config) => {
    return (inputs, outputs, adv) => {
      try {
        const resFn = eval(`(inputs, adv) => (${config.value})`);
        outputs.value.next(resFn(inputs, adv));
      } catch (e) {
        adv.onError(e);
      }
    };
  },
  definitionBuilder: (config) => {
    const inputNames = getVariables(config.value ?? "");
    return {
      defaultStyle: {
        size: "small",
        icon: "code",
      },
      displayName: "Code Expression",
      description: `Evaluates the expression \`${config.value}\``,
      inputs: Object.fromEntries(inputNames.map((input) => [input, {}]) ?? []),
      outputs: {
        value: {
          displayName: "Value",
          description: "The result of the expression evaluation",
        },
      },
    };
  },
  defaultData: {
    value: "`Hello ${inputs.firstName} ${inputs.lastName}`",
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../dist/ui/CodeExpression.js",
  },
};
