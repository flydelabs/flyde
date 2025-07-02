import { CodeNode, DynamicOutput, ConfigurableValue } from "@flyde/core";

interface AddConfig {
  sum: ConfigurableValue;
}

export const Add: CodeNode<AddConfig> = {
  id: "Add",
  mode: "advanced",
  icon: "plus",
  menuDisplayName: "Add",
  menuDescription: "Adds a configured value to the input",
  displayName: () => "Add",
  description: (config) => `Adds ${config.sum.value} to the input value`,
  defaultConfig: {
    sum: { type: "number", value: 1 },
  },
  inputs: () => ({
    value: {
      description: "The value to add to",
    },
  }),
  outputs: () => ({
    output: {
      description: "The sum result",
    },
  }),
  run: (inputs, outputs, adv) => {
    const { sum: sumConfig } = adv.context.config;
    const sum = sumConfig.value;
    const value = inputs.value;

    const outputPin = outputs.output as DynamicOutput;
    outputPin.next(value + sum);
  },
};
