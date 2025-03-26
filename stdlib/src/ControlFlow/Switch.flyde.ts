import { CodeNode } from "@flyde/core";

export interface SwitchConfig {
  inputs: string[];
  cases: {
    name: string;
    conditionExpression: string;
    outputExpression: string;
  }[];
  defaultCase:
  | {
    enabled: true;
    outputExpression: string;
  }
  | {
    enabled: false;
  };
}

export const Switch: CodeNode<SwitchConfig> = {
  id: "Switch",
  namespace: "Control Flow",
  mode: "advanced",
  icon: "sitemap",

  menuDisplayName: "Switch",
  menuDescription:
    "Allows you to switch between multiple outputs based on the value of one input or more, using code expressions",
  displayName: () => "Switch",
  description: (config) =>
    `Switch between ${config.cases.length} cases based on conditions`,
  defaultConfig: {
    inputs: ["value"],
    cases: [
      {
        name: "case1",
        conditionExpression: "inputs.value === 'case1'",
        outputExpression: "inputs.value",
      },
    ],
    defaultCase: {
      enabled: true,
      outputExpression: "inputs.value",
    },
  },
  inputs: (config) =>
    config.inputs.reduce((acc, name, i) => {
      acc[name] = { description: `Switch input no. ${i + 1}` };
      return acc;
    }, {}),
  outputs: (config) => {
    const outputs = config.cases.reduce((acc, { name }, i) => {
      acc[name] = { description: `Switch output no. ${i + 1}` };
      return acc;
    }, {});

    if (config.defaultCase.enabled) {
      outputs["default"] = { description: "Switch default case output" };
    }

    return outputs;
  },
  run: (inputs, outputs, adv) => {
    const { defaultCase, cases } = adv.context.config;

    let foundCase = false;

    for (const { name, conditionExpression, outputExpression } of cases) {
      try {
        const condition = evalExpression(conditionExpression, inputs);
        if (condition) {
          try {
            outputs[name].next(evalExpression(outputExpression, inputs));
            foundCase = true;
          } catch (e) {
            adv.onError(e);
          }
          break;
        }
      } catch (e) {
        adv.onError(e);
      }
    }

    if (!foundCase && defaultCase.enabled) {
      outputs.default.next(
        evalExpression(defaultCase.outputExpression, inputs)
      );
    }
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../dist/ui/Switch.js",
  },
};

function evalExpression(expression: string, inputs: Record<string, unknown>) {
  return eval(`(inputs) => (${expression})`)(inputs);
}
