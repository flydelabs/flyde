import React, { useEffect, useMemo, useRef, useState } from "react";
import * as PubSub from "pubsub-js";
import {
  createNewNodeInstance,
  createRuntimePlayer,
  DebuggerContextData,
  DebuggerContextProvider,
  DependenciesContextData,
  DependenciesContextProvider,
  FlowEditor,
  FlowEditorState,
  FlydeFlowEditorProps,
  RuntimePlayer,
  toastMsg,
  useDebounce,
  vAdd,
} from "@flyde/flow-editor";
import {
  DynamicNodeInput,
  execute,
  FlydeFlow,
  ImportedNode,
  isBaseNode,
  keys,
  noop,
  Node,
  NodeInputs,
  NodeInstance,
  NodeOutput,
  ResolvedDependencies,
  TRIGGER_PIN_ID,
} from "@flyde/core";
import { createHistoryPlayer } from "./createHistoryPlayer";
import { createRuntimeClientDebugger } from "./createRuntimePlayerDebugger";

import "@flyde/flow-editor/src/index.scss";

import produce from "immer";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { EditorDebuggerClient } from "@site/../remote-debugger/dist";
import { useDarkMode } from "usehooks-ts";

// (global as any).vm2 = fakeVm;

const historyPlayer = createHistoryPlayer();

const initialPadding = [0, 0] as [number, number];

export interface EmbeddedFlydeProps {
  flowProps: {
    inputs: Record<string, DynamicNodeInput>;
    flow: FlydeFlow;
    dependencies: ResolvedDependencies;
    output: NodeOutput;
  };
  debugDelay: number;
  onOutput: (data: any) => void;
}

export type PlaygroundFlowDto = {
  flow: FlydeFlow;
  dependencies: ResolvedDependencies;
  output: NodeOutput;
  inputs: NodeInputs;
  onError: any;
  debugDelay?: number;
  player: RuntimePlayer;
};

const runFlow = ({
  flow,
  output,
  inputs,
  onError,
  debugDelay,
  dependencies,
  player,
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
      onBubbleError: (e) => {
        onError(e);
      },
      extraContext: {
        PubSub,
      },
    }),
    localDebugger,
  };
};

export const EmbeddedFlyde: React.FC<EmbeddedFlydeProps> = (props) => {
  const { debugDelay, onOutput, flowProps } = props;
  const { flow, inputs, output } = flowProps;

  const runtimePlayerRef = useRef(createRuntimePlayer());

  const [resolvedDeps, setResolvedDeps] = useState<ResolvedDependencies>(
    props.flowProps.dependencies
  );

  const [localDebugger, setLocalDebugger] =
    useState<Pick<EditorDebuggerClient, "onBatchedEvents">>();

  const [debouncedFlow] = useDebounce(resolvedDeps, 500);

  const darkMode = useDarkMode();

  const onImportNode: DependenciesContextData["onImportNode"] = async (
    importedNode,
    target
  ) => {
    const { node } = importedNode;

    const depNode = Object.values(
      await import("@flyde/stdlib/dist/all-browser")
    ).find((p) => isBaseNode(p) && p.id === node.id) as Node;

    setResolvedDeps((deps) => {
      return {
        ...deps,
        [depNode.id]: {
          ...depNode,
          source: {
            path: "@flyde/stdlib/dist/all-browser",
            export: depNode.id,
          }, // fake, for playground
        },
      };
    });

    let newNodeIns: NodeInstance | undefined = undefined;

    const newFlow = produce(flow, (draft) => {
      if (target) {
        const finalPos = vAdd({ x: 0, y: 0 }, target.pos);
        newNodeIns = createNewNodeInstance(
          importedNode.node,
          0,
          finalPos,
          resolvedDeps
        );
        draft.node.instances.push(newNodeIns);

        if (target.connectTo) {
          const { insId, outputId } = target.connectTo;
          draft.node.connections.push({
            from: {
              insId,
              pinId: outputId,
            },
            to: {
              insId: newNodeIns.id,
              pinId: TRIGGER_PIN_ID,
            },
          });
        }
      }
    });

    // yacky hack to make sure flow is only rerendered when the new node exists
    await new Promise((resolve) => setTimeout(resolve, 10));

    const newState = produce(editorState, (draft) => {
      draft.flow = newFlow;
      if (target?.selectAfterAdding && newNodeIns) {
        draft.boardData.selected = [newNodeIns?.id];
      }
    });

    setFlowEditorState(newState);

    toastMsg(
      `Node ${node.id} successfully imported from ${importedNode.module}`
    );

    return resolvedDeps;
  };

  const onRequestImportables: DependenciesContextData["onRequestImportables"] =
    async () => {
      const nodes = Object.values(
        await import("@flyde/stdlib/dist/all-browser")
      ).filter(isBaseNode) as ImportedNode[];
      return {
        importables: nodes.map((b) => ({
          node: { ...b, source: { path: "n/a", export: "n/a" } },
          module: "@flyde/stdlib",
        })),
        errors: [],
      };
    };

  const [editorState, setFlowEditorState] = useState<FlowEditorState>({
    flow,
    boardData: {
      viewPort: {
        pos: { x: 0, y: 0 },
        zoom: 1,
      },
      lastMousePos: { x: 0, y: 0 },
      selected: [],
    },
  });

  // update flow when props change (e.g. debounce/throttling)
  useEffect(() => {
    setFlowEditorState((state) => ({
      ...state,
      flow,
    }));
  }, [flow]);

  useEffect(() => {
    setResolvedDeps((f) => ({
      ...f,
      main: editorState.flow.node as ImportedNode,
    }));
  }, [editorState.flow.node]);

  const flowEditorProps: FlydeFlowEditorProps = {
    state: editorState,
    onChangeEditorState: setFlowEditorState,
    hideTemplatingTips: true,
    initialPadding,
    onExtractInlineNode: noop as any,
    disableScrolling: true,
    darkMode: darkMode.isDarkMode,
  };

  useEffect(() => {
    runtimePlayerRef.current.start();
  }, []);

  useEffect(() => {
    const { executeResult: clean, localDebugger } = runFlow({
      flow: editorState.flow,
      dependencies: resolvedDeps,
      output,
      inputs,
      onError: noop,
      debugDelay: debugDelay,
      player: runtimePlayerRef.current,
    });
    const sub = props.flowProps.output.subscribe((data) => onOutput(data));
    setLocalDebugger(localDebugger);
    return () => {
      clean();
      sub.unsubscribe();
    };
  }, [debugDelay, debouncedFlow]);

  const depsContextValue = useMemo<DependenciesContextData>(() => {
    return {
      resolvedDependencies: resolvedDeps,
      onImportNode,
      onRequestImportables,
    };
  }, []);

  const debuggerContextValue = useMemo<DebuggerContextData>(() => {
    return {
      debuggerClient: localDebugger,
      onRequestHistory: historyPlayer.requestHistory,
    };
  }, [localDebugger]);

  return (
    <BrowserOnly>
      {() => (
        <DependenciesContextProvider value={depsContextValue}>
          <DebuggerContextProvider value={debuggerContextValue}>
            <FlowEditor {...flowEditorProps} />
          </DebuggerContextProvider>
        </DependenciesContextProvider>
      )}
    </BrowserOnly>
  );
};
