import { DynamicOutput, InternalMacroNode, OutputPinMap } from "@flyde/core";

const node: InternalMacroNode<any> = {
  id: "InlineValue",
  description: "Emits a value",
  definitionBuilder: (val) => {
    return {
      description: `Emits the value ${val}`,
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
  displayNameBuilder: () => `Emit Value`,
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../dist/InlineValue.js",
  },
  defaultData: "",
};

export default node;
