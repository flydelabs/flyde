import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import _ from "lodash";

import * as stdLibBrowser from "@flyde/stdlib/dist/all-browser";

import {
  createRuntimePlayer,
  DebuggerContextData,
  DebuggerContextProvider,
  DependenciesContextData,
  DependenciesContextProvider,
  FlowEditor,
  FlowEditorState,
  toastMsg,
} from "@flyde/flow-editor";
import {
  FlydeFlow,
  ImportedNode,
  noop,
  ResolvedDependencies,
  keys,
  execute,
  dynamicOutput,
  VisualNode,
} from "@flyde/core";
import { createHistoryPlayer } from "./createHistoryPlayer";

import "@flyde/flow-editor/src/index.scss";

import produce from "immer";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { EditorDebuggerClient } from "@site/../remote-debugger/dist";
import { useDarkMode, useDebounce } from "usehooks-ts";
import { getMacroData, processMacroNodes } from "./macroHelpers";
import { createRuntimeClientDebugger } from "./createRuntimePlayerDebugger";
import { defaultBoardData } from "@flyde/flow-editor/dist/visual-node-editor/VisualNodeEditor";
import { onImportNode } from "./onImportNode";
import { onRequestImportables } from "./requestImportables";

const initialPadding = [0, 20] as [number, number];

const FIRST_RUN_DELAY = 1500;
const RE_RUN_DELAY = 3000;
const RUNTIME_STATE_DEBOUNCE = 500;

export interface EmbeddedFlydeProps {
  flowProps: {
    initialFlow: FlydeFlow;
    dependencies: ResolvedDependencies;
  };
  onLog: (msg: string) => void;
  onCompleted: () => void;
  ref?: any;
}

const historyPlayer = createHistoryPlayer();
const runtimePlayer = createRuntimePlayer();

export const EmbeddedFlyde: React.FC<EmbeddedFlydeProps> = forwardRef(
  function EmbeddedFlyde(props, ref) {
    const { flowProps, onCompleted: onComplete } = props;
    const { initialFlow: flow } = flowProps;
    const darkMode = useDarkMode();

    const [resolvedDeps, setResolvedDeps] = useState<ResolvedDependencies>(
      props.flowProps.dependencies
    );

    console.log({ resolvedDeps });

    const [editorState, setFlowEditorState] = useState<FlowEditorState>({
      flow,
      boardData: defaultBoardData,
    } as FlowEditorState);

    const [localDebugger, setLocalDebugger] =
      useState<Pick<EditorDebuggerClient, "onBatchedEvents">>();

    const cleanRunRef = useRef(() => {});

    const _onImportNode: DependenciesContextData["onImportNode"] = useCallback(
      async (importedNode, target) => {
        const { newDeps, newState } = await onImportNode(
          importedNode,
          target,
          editorState,
          resolvedDeps
        );
        setResolvedDeps(newDeps);
        setFlowEditorState(newState);

        toastMsg(
          `Node ${importedNode.node.id} successfully imported from ${importedNode.module}`
        );

        return resolvedDeps;
      },
      [editorState, resolvedDeps]
    );

    const depsContextValue = useMemo<DependenciesContextData>(() => {
      return {
        resolvedDependencies: resolvedDeps,
        onImportNode: _onImportNode,
        onRequestImportables: onRequestImportables,
        libraryData: { groups: [] },
      };
    }, [resolvedDeps]);

    const debuggerContextValue = useMemo<DebuggerContextData>(() => {
      return {
        debuggerClient: localDebugger,
        onRequestHistory: (...args) => historyPlayer.requestHistory(...args),
      };
    }, [localDebugger, historyPlayer]);

    const lastInstancesMacroData = React.useRef<any>(
      getMacroData(editorState.flow.node)
    );

    // resolve macro nodes
    useEffect(() => {
      const insMacroData = getMacroData(editorState.flow.node);

      if (!_.isEqual(insMacroData, lastInstancesMacroData.current)) {
        lastInstancesMacroData.current = insMacroData;

        const { newDeps, newNode } = processMacroNodes(
          editorState.flow.node,
          stdLibBrowser
        );

        const newEditorState = produce(editorState, (draft) => {
          draft.flow.node = newNode;
        });

        setFlowEditorState(newEditorState);
        setResolvedDeps((deps) => ({
          ...deps,
          ...newDeps,
          main: editorState.flow.node as ImportedNode,
        }));
      }
    }, [editorState.flow.node]);

    const runFlowInternal = useCallback(
      (node: VisualNode, deps: ResolvedDependencies) => {
        const localDebugger = createRuntimeClientDebugger(
          runtimePlayer,
          historyPlayer
        );

        runtimePlayer.start();

        setLocalDebugger(localDebugger);

        const firstOutputName = keys(node.outputs)[0];

        const output = dynamicOutput();

        const sub = output.subscribe((v) => {
          props.onLog(v);
        });

        let completionTimeout: any = null;

        const clean = execute({
          node,
          inputs: {},
          outputs: { [firstOutputName]: output },
          resolvedDeps: { ...deps, [node.id]: node },
          _debugger: localDebugger,
          onBubbleError: (e) => {
            console.error(e);
          },
          onCompleted: () => {
            sub.unsubscribe();
            onComplete();
            completionTimeout = setTimeout(() => {
              setFlowEditorState((state) => ({ ...state })); // force re-run
            }, RE_RUN_DELAY);
          },
        });
        const cleanAll = () => {
          clean();
          sub.unsubscribe();
          runtimePlayer.clear();
          historyPlayer.clear();
          localDebugger.destroy();
          clearTimeout(completionTimeout);
        };

        cleanRunRef.current = cleanAll;
      },
      []
    );

    useImperativeHandle(
      ref,
      () => {
        return {
          runFlow: () => {
            cleanRunRef.current();
            runFlowInternal(editorState.flow.node, resolvedDeps);
          },
        };
      },
      [editorState, resolvedDeps]
    );

    return (
      <BrowserOnly>
        {() => (
          <DependenciesContextProvider value={depsContextValue}>
            <DebuggerContextProvider value={debuggerContextValue}>
              <FlowEditor
                state={editorState}
                onChangeEditorState={setFlowEditorState}
                initialPadding={initialPadding}
                onExtractInlineNode={noop as any}
                disableScrolling={true}
                darkMode={darkMode.isDarkMode}
              />
            </DebuggerContextProvider>
          </DependenciesContextProvider>
        )}
      </BrowserOnly>
    );
  }
);
