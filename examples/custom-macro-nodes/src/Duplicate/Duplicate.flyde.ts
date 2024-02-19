import { DynamicOutput, MacroNode, OutputPinMap } from "@flyde/core";

const node: MacroNode<number> = {
  id: "Duplicate",
  description: "Duplicates the input value",
  definitionBuilder: (times) => {
    const outputs = "x"
      .repeat(times)
      .split("")
      .reduce<OutputPinMap>((acc, _, i) => {
        return {
          ...acc,
          [`output${i}`]: {
            description: `The duplicated value ${i}`,
          },
        };
      }, {});

    return {
      description: `Duplicates the input value`,
      displayName: `Duplicate x ${times}`,
      inputs: {
        value: {
          description: "The value to be duplicated",
        },
      },
      outputs,
    };
  },
  runFnBuilder: (times) => async (inputs, outputs) => {
    const value = inputs.value;

    for (let i = 0; i < times; i++) {
      const outputPin = outputs[`output${i}`] as DynamicOutput;
      outputPin.next(value);
    }
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../../dist/Duplicate.js",
  },
  defaultData: 2,
};

export default node;
