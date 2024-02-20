import { DynamicOutput, MacroNode, OutputPinMap } from "@flyde/core";

const node: MacroNode<number> = {
  id: "Add",
  description: "Adds the input value",
  defaultData: 1,
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "./Macro.flyde.ts",
  },
  definitionBuilder: (sum) => {
    return {
      description: `Adds ${sum} to the input value`,
      inputs: {
        value: {
          description: `The value to add ${sum} to`,
        },
      },
      outputs: {
        output: {
          description: `The value plus ${sum}`,
        },
      },
    };
  },
  runFnBuilder: (sum) => async (inputs, outputs) => {
    const value = inputs.value;
    const outputPin = outputs.output as DynamicOutput;
    outputPin.next(value + sum);
  },
};

export default node;
