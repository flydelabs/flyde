import {
  FlydeFlow,
  NodeInputs,
  NodeOutput,
  ResolvedDependencies,
  execute,
  keys,
} from "@flyde/core";
import { RuntimePlayer } from "@flyde/flow-editor";
import { HistoryPlayer } from "@site/src/components/EmbeddedFlyde/createHistoryPlayer";
import { createRuntimeClientDebugger } from "@site/src/components/EmbeddedFlyde/createRuntimePlayerDebugger";

export type PlaygroundFlowDto = {
  flow: FlydeFlow;
  dependencies: ResolvedDependencies;
  output: NodeOutput;
  inputs: NodeInputs;
  onError: any;
  debugDelay?: number;
  runtimePlayer: RuntimePlayer;
  onCompleted?: (data: any) => void;
  historyPlayer: HistoryPlayer;
};

export const runFlow = ({
  flow,
  output,
  inputs,
  onError,
  debugDelay,
  onCompleted,
  dependencies,
  runtimePlayer: player,
  historyPlayer,
}: PlaygroundFlowDto) => {
  const localDebugger = createRuntimeClientDebugger(player, historyPlayer);

  localDebugger.debugDelay = debugDelay;

  const firstOutputName = keys(flow.node.outputs)[0];

  return {
    executeResult: execute({
      node: flow.node,
      inputs: inputs,
      outputs: { [firstOutputName]: output },
      resolvedDeps: { ...dependencies, [flow.node.id]: flow.node },
      _debugger: localDebugger,
      onCompleted,
      onBubbleError: (e) => {
        onError(e);
      },
    }),
    localDebugger,
  };
};
