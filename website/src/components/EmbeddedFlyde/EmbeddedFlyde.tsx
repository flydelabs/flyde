import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import _ from "lodash";

import {
  createRuntimePlayer,
  DebuggerContextData,
  DebuggerContextProvider,
  defaultPorts,
  EditorPorts,
  FlowEditor,
  FlowEditorState,
  PortsContext,
} from "@flyde/flow-editor";
import {
  FlydeFlow,
  keys,
  execute,
  dynamicOutput,
  VisualNode,
} from "@flyde/core";
import { createHistoryPlayer } from "./createHistoryPlayer";

import "@flyde/flow-editor/src/index.scss";

import BrowserOnly from "@docusaurus/BrowserOnly";
import { EditorDebuggerClient } from "@site/../remote-debugger/dist";
import { useDarkMode } from "usehooks-ts";
import { createRuntimeClientDebugger } from "./createRuntimePlayerDebugger";
import { defaultBoardData } from "@flyde/flow-editor/dist/visual-node-editor/VisualNodeEditor";
import { resolveEditorInstance } from "@flyde/resolver/dist/resolver/resolveEditorInstance";
import { websiteNodesFinder } from "./nodesFinder";

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

    const portsValue = useMemo(() => {
      const ports: EditorPorts = {
        ...defaultPorts,
        resolveInstance: async ({ instance }) => {
          const { type, source, nodeId } = instance;

          if (instance.type === "code") {
            return resolveEditorInstance(instance, websiteNodesFinder);
          }

          throw new Error(`Instance ${instance.id} not found`);
        },
      };
      return ports;
    }, []);

    return (
      <BrowserOnly>
        {() => (
          <PortsContext.Provider value={portsValue}>
            <DebuggerContextProvider value={debuggerContextValue}>
              <FlowEditor
                state={editorState}
                onChangeEditorState={setFlowEditorState}
                initialPadding={initialPadding}
                darkMode={true}
              />
            </DebuggerContextProvider>
          </PortsContext.Provider>
        )}
      </BrowserOnly>
    );
  }
);
