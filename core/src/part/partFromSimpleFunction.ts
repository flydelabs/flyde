import { CodePart } from ".";
import { InputMode } from "./part-pins";

export type SimpleFnData = {
  id: string;
  description: string;
  namespace: string;
  inputs?: { name: string; description: string; mode?: InputMode }[];
  output?: { name: string; description: string };
  fn: (...args: any[]) => any;
  symbol?: string;
  icon?: string;
  customViewCode?: string;
}

export function partFromSimpleFunction(data: SimpleFnData): CodePart {
  return {
    id: data.id,
    description: data.description,
    namespace: data.namespace,
    inputs: data.inputs
      ? data.inputs.reduce(
          (obj, { name, description, mode }) => ({
            ...obj,
            [name]: { description, mode: mode ?? 'required' },
          }),
          {}
        )
      : {},
    outputs: data.output
      ? { [data.output.name]: { description: data.output.description } }
      : {},
    defaultStyle: {
      icon: data.icon,
    },
    fn: async function (inputs, outputs, adv) {
      const args = (data.inputs ?? []).map(({ name }) => inputs[name]);
      try {
        const result = await Promise.resolve(data.fn(...args));
        if (data.output) {
          outputs[data.output.name].next(result);
        }
      } catch (e) {
        console.error("Error in part", e);
        adv.onError(e);
      }
    },
    customViewCode: data.customViewCode,
  };
}
