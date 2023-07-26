import React, { useEffect, useMemo, useRef, useState } from "react";
import * as PubSub from "pubsub-js";
import {
  createNewPartInstance,
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
import { fakeVm } from "@site/src/fake-vm";
import {
  DynamicPartInput,
  execute,
  FlydeFlow,
  ImportedPart,
  isBasePart,
  keys,
  noop,
  Part,
  PartInputs,
  PartInstance,
  PartOutput,
  ResolvedDependencies,
  TRIGGER_PIN_ID,
} from "@flyde/core";
import { createHistoryPlayer } from "./createHistoryPlayer";
import { createRuntimeClientDebugger } from "./createRuntimePlayerDebugger";

import "@flyde/flow-editor/src/index.scss";

import produce from "immer";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { EditorDebuggerClient } from "@site/../remote-debugger/dist";
import { useEventCallback } from "usehooks-ts";

(global as any).vm2 = fakeVm;

const historyPlayer = createHistoryPlayer();

const initialPadding = [0, 0] as [number, number];

export interface EmbeddedFlydeProps {
  flowProps: {
    inputs: Record<string, DynamicPartInput>;
    flow: FlydeFlow;
    dependencies: ResolvedDependencies;
    output: PartOutput;
  };
  debugDelay: number;
  onOutput: (data: any) => void;
}

export type PlaygroundFlowDto = {
  flow: FlydeFlow;
  dependencies: ResolvedDependencies;
  output: PartOutput;
  inputs: PartInputs;
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

  const firstOutputName = keys(flow.part.outputs)[0];

  return {
    executeResult: execute({
      part: flow.part,
      inputs: inputs,
      outputs: { [firstOutputName]: output },
      resolvedDeps: { ...dependencies, [flow.part.id]: flow.part },
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

  const onImportPart: DependenciesContextData["onImportPart"] = async (
    importedPart,
    target
  ) => {
    const { part } = importedPart;

    const depPart = Object.values(
      await import("@flyde/stdlib/dist/all-browser")
    ).find((p) => isBasePart(p) && p.id === part.id) as Part;

    setResolvedDeps((flow) => {
      return {
        ...flow,
        dependencies: {
          ...flow.dependencies,
          [depPart.id]: {
            ...depPart,
            source: {
              path: "@flyde/stdlib/dist/all-browser",
              export: depPart.id,
            }, // fake, for playground
          },
        },
      };
    });

    let newPartIns: PartInstance | undefined = undefined;

    const newFlow = produce(flow, (draft) => {
      if (target) {
        const finalPos = vAdd({ x: 0, y: 0 }, target.pos);
        newPartIns = createNewPartInstance(
          importedPart.part,
          0,
          finalPos,
          resolvedDeps
        );
        draft.part.instances.push(newPartIns);

        if (target.connectTo) {
          const { insId, outputId } = target.connectTo;
          draft.part.connections.push({
            from: {
              insId,
              pinId: outputId,
            },
            to: {
              insId: newPartIns.id,
              pinId: TRIGGER_PIN_ID,
            },
          });
        }
      }
    });

    // yacky hack to make sure flow is only rerendered when the new part exists
    await new Promise((resolve) => setTimeout(resolve, 10));

    const newState = produce(editorState, (draft) => {
      draft.flow = newFlow;
      if (target?.selectAfterAdding && newPartIns) {
        draft.boardData.selected = [newPartIns?.id];
      }
    });

    setFlowEditorState(newState);

    toastMsg(
      `Part ${part.id} successfully imported from ${importedPart.module}`
    );

    return resolvedDeps;
  };

  const onRequestImportables: DependenciesContextData["onRequestImportables"] =
    async () => {
      const parts = Object.values(
        await import("@flyde/stdlib/dist/all-browser")
      ).filter(isBasePart) as ImportedPart[];
      return {
        importables: parts.map((b) => ({
          part: { ...b, source: { path: "n/a", export: "n/a" } },
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
      main: editorState.flow.part as ImportedPart,
    }));
  }, [editorState.flow.part]);

  const flowEditorProps: FlydeFlowEditorProps = {
    state: editorState,
    onChangeEditorState: setFlowEditorState,
    hideTemplatingTips: true,
    initialPadding,
    onExtractInlinePart: noop as any,
    disableScrolling: true,
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
      onImportPart,
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
