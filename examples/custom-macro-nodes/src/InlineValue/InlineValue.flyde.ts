import { DynamicOutput, MacroNode } from "@flyde/core";

const node: MacroNode<any> = {
  id: "InlineValue",
  description: "Emits a value",
  definitionBuilder: (val) => {
    return {
      description: `Emits the value ${val}`,
      displayName: `Inline Value: ${val}`,
      inputs: {},
      outputs: {
        output: {
          description: `The value ${val}`,
        },
      },
    };
  },
  runFnBuilder: (val) => async (inputs, outputs) => {
    const outputPin = outputs.output as DynamicOutput;
    outputPin.next(val);
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../../dist/InlineValue.js",
  },
  defaultData: "",
};

export default node;
