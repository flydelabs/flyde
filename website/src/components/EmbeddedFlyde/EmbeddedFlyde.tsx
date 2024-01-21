import React, { createRef, useEffect, useMemo, useRef, useState } from "react";
import _ from "lodash";

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
  toastMsg,
  useDebounce,
  vAdd,
} from "@flyde/flow-editor";
import {
  DynamicNodeInput,
  FlydeFlow,
  ImportedNode,
  isBaseNode,
  noop,
  Node,
  NodeInstance,
  NodeOutput,
  ResolvedDependencies,
  TRIGGER_PIN_ID,
  isMacroNodeInstance,
  isMacroNode,
  MacroNode,
  VisualNode,
  isInlineNodeInstance,
  isVisualNode,
} from "@flyde/core";
import { HistoryPlayer } from "./createHistoryPlayer";

import { processMacroNodeInstance } from "@flyde/resolver/dist/resolver/resolve-dependencies/process-macro-node-instance";

import "@flyde/flow-editor/src/index.scss";

import produce from "immer";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { EditorDebuggerClient } from "@site/../remote-debugger/dist";
import { useDarkMode } from "usehooks-ts";

const initialPadding = [0, 20] as [number, number];

export interface EmbeddedFlydeProps {
  flowProps: {
    initialFlow: FlydeFlow;
    dependencies: ResolvedDependencies;
  };
  localDebugger: Pick<EditorDebuggerClient, "onBatchedEvents">;
  historyPlayer: HistoryPlayer;
}

export const EmbeddedFlyde: React.FC<EmbeddedFlydeProps> = (props) => {
  const { flowProps, localDebugger, historyPlayer } = props;
  const { initialFlow: flow } = flowProps;

  const [resolvedDeps, setResolvedDeps] = useState<ResolvedDependencies>(
    props.flowProps.dependencies
  );

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
  } as FlowEditorState);

  const [debouncedFlow] = useDebounce(resolvedDeps, 500);
  const [debouncedState] = useDebounce(editorState, 500);

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

  const depsContextValue = useMemo<DependenciesContextData>(() => {
    return {
      resolvedDependencies: resolvedDeps,
      onImportNode,
      onRequestImportables,
      libraryData: { groups: [] },
    };
  }, [resolvedDeps]);

  const debuggerContextValue = useMemo<DebuggerContextData>(() => {
    return {
      debuggerClient: localDebugger,
      onRequestHistory: historyPlayer.requestHistory,
    };
  }, [localDebugger]);

  const lastInstancesMacroData = React.useRef<any>([]);

  useEffect(() => {
    import("@flyde/stdlib/dist/all-browser").then((stdlib) => {
      // syncs macro data from instances to the resolved deps
      const insMacroData = editorState.flow.node.instances.flatMap((ins) => {
        if (isMacroNodeInstance(ins)) {
          return ins.macroData;
        } else {
          return [];
        }
      });

      if (!_.isEqual(insMacroData, lastInstancesMacroData.current)) {
        lastInstancesMacroData.current = insMacroData;

        const newDeps: Record<string, ImportedNode> = {};

        function maybeProcessMacroNodeInstances(node: VisualNode) {
          const newInstances = node.instances.map((ins) => {
            if (isMacroNodeInstance(ins)) {
              const macroNode = Object.values(stdlib).find(
                (p) => isMacroNode(p) && p.id === ins.macroId
              ) as MacroNode<any>;

              if (!macroNode) {
                throw new Error(
                  `Could not find macro node ${ins.macroId} in embedded stdlib`
                );
              }

              const newNode = processMacroNodeInstance("", macroNode, ins);

              newDeps[newNode.id] = { ...newNode, source: { path: "" } };
              return { ...ins, nodeId: newNode.id };
            } else if (isInlineNodeInstance(ins) && isVisualNode(ins.node)) {
              return {
                ...ins,
                node: maybeProcessMacroNodeInstances(ins.node),
              };
            } else {
              return ins;
            }
          });
          return { ...node, instances: newInstances };
        }

        const newEditorState = produce(editorState, (draft) => {
          draft.flow.node = maybeProcessMacroNodeInstances(
            editorState.flow.node
          );
        });

        setFlowEditorState(newEditorState);
        setResolvedDeps((deps) => ({
          ...deps,
          ...newDeps,
        }));
      }
    });
  }, [editorState.flow.node]);

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
