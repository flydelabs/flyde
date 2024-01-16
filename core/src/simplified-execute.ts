import {
  Node,
  NodeInputs,
  NodesCollection,
  dynamicNodeInput,
  dynamicOutput,
  keys,
} from ".";
import { execute, ExecuteParams } from "./execute";

export const simplifiedExecute = (
  nodeToRun: Node,
  resolvedDependencies: NodesCollection,
  inputs: Record<string, any> = {},
  onOutput?: (key: string, data: any) => void,
  otherParams: Partial<ExecuteParams> = {}
) => {
  const outputKeys = keys(nodeToRun.outputs);

  const _inputs = Object.keys(inputs).reduce<NodeInputs>((acc, curr) => {
    return {
      ...acc,
      [curr]: dynamicNodeInput(),
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

  const cancelFn = execute({
    node: nodeToRun,
    inputs: _inputs,
    outputs,
    resolvedDeps: resolvedDependencies,
    onBubbleError: (err) => {
      throw err;
    },
    ...otherParams,
  });

  Object.entries(inputs).forEach(([k, v]) => {
    _inputs[k].subject.next(v);
  });

  return cancelFn;
};
