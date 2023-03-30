import { CodePart } from "@flyde/core";

const namespace = "State";

export const SetGlobalState: CodePart = {
  id: "Set Global State",
  namespace,
  description: "Sets a value in the global state",
  inputs: {
    key: { description: "Key to set" },
    value: { description: "Value to set" },
  },
  outputs: {
    setValue: { description: "Value that was set" },
  },
  fn: ({ key, value }, { setValue }, { globalState }) => {
    globalState.set(key, value);
    setValue.next(value);
  },
};

export const GetGlobalState: CodePart = {
  id: "Get Global State",
  namespace,
  description: "Gets a value from the global state",
  inputs: {
    key: { description: "Key to get" },
    defaultValue: {
      description: "Default value if key is not set",
      mode: "required-if-connected",
    },
  },
  outputs: {
    value: { description: "Value of the key" },
  },
  fn: ({ key, defaultValue }, { value }, { globalState }) => {
    value.next(globalState.get(key) ?? defaultValue);
  },
};
