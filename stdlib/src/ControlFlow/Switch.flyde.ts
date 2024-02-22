import { InputPinMap, MacroNode, OutputPinMap } from "@flyde/core";

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

export const Switch: MacroNode<SwitchConfig> = {
  id: "Switch",
  namespace: "Control Flow",
  defaultStyle: {
    icon: "sitemap",
  },
  description:
    "Allows you to switch between multiple outputs based on the value of one input or more, using code expressions",
  runFnBuilder: (config) => {
    function evalExpression(expression: string, inputs: any) {
      return eval(`(inputs) => (${expression})`)(inputs);
    }
    return (inputs, outputs, adv) => {
      const { defaultCase, cases: cases } = config;

      let foundCase = false;

      for (const { name, conditionExpression, outputExpression } of cases) {
        try {
          const condition = evalExpression(conditionExpression, inputs);
          console.log({ condition, conditionExpression, inputs });
          if (condition) {
            try {
              console.log(4242, condition);
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
    };
  },
  definitionBuilder: (config) => {
    const { inputs, cases: outputs, defaultCase } = config;

    const inputDefs = inputs.map((name, i) => ({
      name,
      description: `Switch input no. ${i + 1}`,
    }));

    const outputDefs = outputs.map(({ name }, i) => ({
      name,
      description: `Switch output no. ${i + 1}`,
    }));

    if (defaultCase.enabled) {
      outputDefs.push({
        name: "default",
        description: "Switch default case output",
      });
    }

    return {
      inputs: inputDefs.reduce<InputPinMap>((acc, { name, description }) => {
        acc[name] = { description };
        return acc;
      }, {}),
      outputs: outputDefs.reduce<OutputPinMap>((acc, { name, description }) => {
        acc[name] = { description };
        return acc;
      }, {}),
      displayName: "Switch",
    };
  },
  defaultData: {
    inputs: ["value"],
    cases: [
      {
        name: "case1",
        conditionExpression: "",
        outputExpression: "inputs.value",
      },
    ],
    defaultCase: {
      enabled: true,
      outputExpression: "input.value",
    },
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../../dist/ui/Switch.js",
  },
};
