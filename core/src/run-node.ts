import { execute, ExecuteParams, dynamicNodeInput, dynamicOutput, NodeInputs, keys, InternalNode } from ".";

// Expose all existing ExecuteParams features
export interface RunNodeOptions extends Omit<ExecuteParams, 'node' | 'inputs' | 'outputs'> {
  onOutputs?: (key: string, data: any) => void;
  executionDelay?: number;
}

// Simple async function that returns outputs directly
export async function runNode<TInputs = any, TOutputs = any>(
  node: InternalNode,
  inputs: TInputs,
  options?: RunNodeOptions
): Promise<TOutputs> {
  return new Promise((resolve, reject) => {
    const collectedOutputs: Record<string, any> = {};
    const outputKeys = keys(node.outputs);

    // Create input subjects for all node inputs
    const _inputs = Object.keys(node.inputs).reduce<NodeInputs>((acc, curr) => {
      return {
        ...acc,
        [curr]: dynamicNodeInput()
      };
    }, {});

    // Create output subjects
    const outputs = outputKeys.reduce((acc, k) => {
      const output = dynamicOutput();
      output.subscribe((value) => {
        collectedOutputs[k] = value;
        options?.onOutputs?.(k, value);
      });
      return { ...acc, [k]: output };
    }, {});

    // Execute with proper error handling
    execute({
      node,
      inputs: _inputs,
      outputs,
      onBubbleError: (err) => {
        reject(err);
      },
      onCompleted: (data) => {
        options?.onCompleted?.(data);
        resolve(collectedOutputs as TOutputs);
      },
      ...options
    });

    Object.entries(inputs as any).forEach(([k, v]) => {
      if (_inputs[k]) {
        _inputs[k].subject.next(v);
      }
    });
  });
}