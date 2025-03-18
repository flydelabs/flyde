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
} from "@flyde/flow-editor";
import {
  FlydeFlow,
  ImportedNode,
  noop,
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
import { createRuntimeClientDebugger } from "./createRuntimePlayerDebugger";
import { defaultBoardData } from "@flyde/flow-editor/dist/visual-node-editor/VisualNodeEditor";
import { onImportNode } from "./onImportNode";
import { onRequestImportables } from "./requestImportables";

const initialPadding = [0, 20] as [number, number];

const RE_RUN_DELAY = 3000;

export interface EmbeddedFlydeProps {
  flowProps: {
    initialFlow: FlydeFlow;
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

    const [editorState, setFlowEditorState] = useState<FlowEditorState>({
      flow,
      boardData: defaultBoardData,
    } as FlowEditorState);

    const [localDebugger, setLocalDebugger] =
      useState<Pick<EditorDebuggerClient, "onBatchedEvents">>();

    const cleanRunRef = useRef(() => {});

    const debuggerContextValue = useMemo<DebuggerContextData>(() => {
      return {
        debuggerClient: localDebugger,
        onRequestHistory: (...args) => historyPlayer.requestHistory(...args),
      };
    }, [localDebugger, historyPlayer]);

    const runFlowInternal = useCallback((node: VisualNode) => {
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
        node: node as any,
        inputs: {},
        outputs: { [firstOutputName]: output },
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
        // runtimePlayer.clear();
        historyPlayer.clear();
        localDebugger.destroy();
        clearTimeout(completionTimeout);
      };

      cleanRunRef.current = cleanAll;
    }, []);

    useImperativeHandle(
      ref,
      () => {
        return {
          runFlow: () => {
            cleanRunRef.current();
            runFlowInternal(editorState.flow.node);
          },
        };
      },
      [editorState]
    );

    return (
      <BrowserOnly>
        {() => (
          <DependenciesContextProvider value={{} as any}>
            <DebuggerContextProvider value={debuggerContextValue}>
              <FlowEditor
                state={editorState}
                onChangeEditorState={setFlowEditorState}
                initialPadding={initialPadding}
                onExtractInlineNode={noop as any}
                darkMode={true}
              />
            </DebuggerContextProvider>
          </DependenciesContextProvider>
        )}
      </BrowserOnly>
    );
  }
);
