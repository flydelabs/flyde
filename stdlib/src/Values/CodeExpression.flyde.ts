import { MacroNode } from "@flyde/core";
import { getVariables } from "./getInlineVariables";

export interface CodeExpressionConfig {
  value: string;
  label: string;
}

export const CodeExpression: MacroNode<CodeExpressionConfig> = {
  id: "CodeExpression",
  displayName: "Inline Code",
  defaultStyle: {
    icon: "code",
  },
  description: "A static value or JS expression",
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
    const inputNames = getVariables(config.value);
    return {
      defaultStyle: {
        size: "small",
        icon: "code",
      },
      displayName: config.label || undefined,
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
    value: "inputs.a + inputs.b",
    label: '"inputs.a + inputs.b"',
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../../dist/ui/CodeExpression.js",
  },
};
