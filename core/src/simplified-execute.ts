import {
  Node,
  NodesCollection,
  dynamicOutput,
  keys,
  staticNodeInput,
  isDynamicInput,
} from ".";
import { execute, ExecuteParams } from "./execute";

export const simplifiedExecute = (
  nodeToRun: Node,
  resolvedDependencies: NodesCollection,
  inputs: Record<string, any>,
  onOutput?: (key: string, data: any) => void,
  otherParams: Partial<ExecuteParams> = {}
) => {
  const outputKeys = keys(nodeToRun.outputs);

  const _inputs = Object.keys(inputs).reduce((acc, curr) => {
    const input = inputs[curr];
    return {
      ...acc,
      [curr]: isDynamicInput(input) ? input : staticNodeInput(input),
    };
  }, {});

  const outputs = outputKeys.reduce((acc, k) => {
    const output = dynamicOutput();
    if (onOutput) {
      output.subscribe((value) => {
        onOutput(k, value);
      });
    }
    return { ...acc, [k]: output };
  }, {});

  return execute({
    node: nodeToRun,
    inputs: _inputs,
    outputs,
    resolvedDeps: resolvedDependencies,
    onBubbleError: (err) => {
      throw err;
    },
    ...otherParams,
  });
};
