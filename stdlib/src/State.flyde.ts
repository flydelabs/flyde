import { CodeNode } from "@flyde/core";

const namespace = "State";

export const SetGlobalState: CodeNode = {
  id: "Set State",
  defaultStyle: {
    icon: "fa-pen",
  },
  namespace,
  description: "Sets a value in the global state",
  inputs: {
    key: { description: "Key to set" },
    value: { description: "Value to set" },
  },
  outputs: {
    setValue: { description: "Value that was set" },
  },
  run: ({ key, value }, { setValue }, { globalState }) => {
    globalState.set(key, value);
    setValue.next(value);
  },
};

export const GetGlobalState: CodeNode = {
  id: "Get State",
  defaultStyle: {
    icon: "fa-eye",
  },
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
  run: ({ key, defaultValue }, { value }, { globalState, onError }) => {
    const val = globalState.get(key);
    if (val === undefined && defaultValue === undefined) {
      onError(new Error(`Key ${key} is not set`));
    } else {
      value.next(globalState.get(key) ?? defaultValue);
    }
  },
};
