import { InternalCodeNode } from "@flyde/core";

const namespace = "State";

export const GetGlobalState: InternalCodeNode = {
  id: "Get State",
  icon: "fa-eye",
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
