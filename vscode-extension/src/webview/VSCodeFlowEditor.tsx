import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BootstrapData } from "./bootstrap";
import {
  FlowEditor,
  FlowEditorState,
  defaultViewPort,
  createRuntimePlayer,
  DebuggerContextProvider,
  DarkModeProvider,
  PortsContext,
  RuntimePlayer,
} from "@flyde/flow-editor";
import "@flyde/flow-editor/dist/styles/tailwind.scss";
import "@flyde/flow-editor/src/index.scss";
import {
  FlydeFlow,
  isVisualNode,
} from "@flyde/core";
import { createEditorClient, EditorDebuggerClient } from "@flyde/remote-debugger/dist/client";
import { createVsCodePorts } from "./vscode-ports";
import { useDebouncedCallback } from "use-debounce";

const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isEqual(a[key], b[key])) return false;
  }
  
  return true;
};

export const VSCodeFlowEditor: React.FC<BootstrapData> = ({
  initialNode,
  port,
  relativeFile,
  executionId,
  darkMode
}) => {
  const [editorState, setEditorState] = useState<FlowEditorState>({
    flow: { node: initialNode },
    boardData: {
      viewPort: defaultViewPort,
      lastMousePos: { x: 0, y: 0 },
      selectedInstances: [],
      selectedConnections: [],
    },
  });

  const [debuggerClient, setDebuggerClient] = useState<EditorDebuggerClient>();
  const runtimePlayer = useRef<RuntimePlayer>();
  const lastChangeReason = useRef<string>("");
  const didMount = useRef(false);

  const ports = useMemo(() => createVsCodePorts(), []);

  const connectToRemoteDebugger = useCallback((url: string) => {
    const newClient = createEditorClient(url, executionId);

    if (debuggerClient) {
      debuggerClient.destroy();
    }

    setDebuggerClient(newClient);
    if (runtimePlayer.current) {
      runtimePlayer.current.destroy();
    }
    const newPlayer = createRuntimePlayer();
    runtimePlayer.current = newPlayer;

    (window as any).__runtimePlayer = runtimePlayer;

    const dt = 0;
    runtimePlayer.current.start(dt);
  }, [debuggerClient, executionId]);

  useEffect(() => {
    connectToRemoteDebugger(`http://localhost:${port}`);
    return () => {
      if (debuggerClient) {
        debuggerClient.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (debuggerClient) {
      return debuggerClient.onBatchedEvents((events) => {
        if (runtimePlayer.current) {
          console.info(`Batched events - ${events.length} into player`, events);
          runtimePlayer.current.addEvents(events);
        } else {
          console.info(`Batched events - ${events.length} but no player`, events);
        }
      });
    }
  }, [debuggerClient]);

  const debouncedSaveFile = useDebouncedCallback(
    (flow: FlydeFlow, src: string) => {
      const cleanFlow: FlydeFlow = {
        ...flow,
        node: {
          ...flow.node,
          instances: flow.node.instances.map((ins) => {
            const copy = { ...ins };
            const node = (ins as any).node;
            if (node && !isVisualNode(node)) {
              delete (copy as any).node;
            }
            return copy;
          }),
        },
      };
      ports.setFlow({ absPath: src, flow: cleanFlow });
    },
    500
  );

  useEffect(() => {
    return ports.onExternalFlowChange(({ flow }) => {
      if (isEqual(flow, editorState.flow) === false) {
        setEditorState((state) => ({ ...state, flow }));
        lastChangeReason.current = "external-changes";
      }
    });
  }, [editorState.flow, ports]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
    } else {
      if (lastChangeReason.current !== "external-changes") {
        debouncedSaveFile(editorState.flow, relativeFile);
        lastChangeReason.current = "n/a";
      }
    }
  }, [editorState.flow, debouncedSaveFile, relativeFile]);

  const onRequestHistory = useCallback(
    (insId: string, pinId?: string, pinType?: any) => {
      if (!debuggerClient) {
        return Promise.resolve({ total: 0, lastSamples: [] });
      }
      return debuggerClient.getHistory({
        insId,
        pinId,
        type: pinType,
        limit: 10,
        executionId,
      });
    },
    [debuggerClient, executionId]
  );

  const debuggerContextValue = useMemo(() => ({
    onRequestHistory,
    debuggerClient,
  }), [onRequestHistory, debuggerClient]);

  return (
    <DarkModeProvider value={darkMode}>
      <PortsContext.Provider value={ports}>
        <DebuggerContextProvider value={debuggerContextValue}>
          <div className="vscode-flow-editor" style={{ height: "100vh", width: "100vw" }}>
            <FlowEditor
              state={editorState}
              onChangeEditorState={setEditorState}
              darkMode={darkMode}
            />
          </div>
        </DebuggerContextProvider>
      </PortsContext.Provider>
    </DarkModeProvider>
  );
};