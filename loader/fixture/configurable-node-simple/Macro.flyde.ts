import { CodeNode, DynamicOutput, ConfigurableValue } from "@flyde/core";

interface DuplicateConfig {
  times: ConfigurableValue;
}

export const Duplicate: CodeNode<DuplicateConfig> = {
  id: "Duplicate",
  mode: "advanced",
  icon: "copy",
  menuDisplayName: "Duplicate",
  menuDescription: "Duplicates the input value a specified number of times",
  displayName: () => "Duplicate",
  description: (config) => `Duplicates the input value ${config.times} times`,
  defaultConfig: {
    times: { type: "number", value: 1 },
  },
  inputs: () => ({
    value: {
      description: "The value to be duplicated",
    },
  }),
  outputs: (config) => {
    return "x"
      .repeat(config.times.value)
      .split("")
      .reduce((acc, _, i) => {
        return {
          ...acc,
          [`output${i}`]: {
            description: `The duplicated value ${i}`,
          },
        };
      }, {});
  },
  run: (inputs, outputs, adv) => {
    const { times: timesConfig } = adv.context.config;
    const times = timesConfig.value;
    const value = inputs.value;

    for (let i = 0; i < times; i++) {
      const outputPin = outputs[`output${i}`] as DynamicOutput;
      outputPin.next(value);
    }
  },
};
