import { BaseNode, CodeNode, NodeStyleSize, RunNodeFunction } from ".";
import { InputMode } from "./node-pins";

export type SimpleFnData = Omit<BaseNode, "inputs" | "outputs" | "run"> & {
  id: string;
  description: string;
  namespace: string;
  inputs?: {
    name: string;
    description: string;
    mode?: InputMode;
    defaultValue?: any;
  }[];
  output?: { name: string; description: string };
  run?: (...args: any[]) => any;
  symbol?: string;
  icon?: string;
  size?: NodeStyleSize;
  customViewCode?: string;
  fullRunFn?: RunNodeFunction; // hack to start migrating these back
};

export function nodeFromSimpleFunction(data: SimpleFnData): CodeNode {
  return {
    ...data,
    id: data.id,
    description: data.description,
    namespace: data.namespace,
    inputs: data.inputs
      ? data.inputs.reduce(
          (obj, { name, description, mode, defaultValue }) => ({
            ...obj,
            [name]: { description, mode: mode ?? "required", defaultValue },
          }),
          {}
        )
      : {},
    outputs: data.output
      ? { [data.output.name]: { description: data.output.description } }
      : {},
    defaultStyle: {
      icon: data.icon,
      size: data.size,
    },
    run:
      data.fullRunFn ??
      async function (inputs, outputs, adv) {
        const args = (data.inputs ?? []).map(({ name }) => inputs[name]);
        try {
          const result = await Promise.resolve(data.run(...args));
          if (data.output) {
            outputs[data.output.name]?.next(result);
          }
        } catch (e) {
          console.error("Error in node", e);
          adv.onError(e);
        }
      },
    customViewCode: data.customViewCode,
  };
}
