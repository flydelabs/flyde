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
