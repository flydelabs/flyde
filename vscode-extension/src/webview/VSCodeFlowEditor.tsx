import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BootstrapData } from "./bootstrap";
import {
  FlowEditor,
  FlowEditorState,
  defaultViewPort,
  createRuntimePlayer,
  DebuggerContextProvider,
  DarkModeProvider,
  useDebounce,
} from "@flyde/flow-editor";
import "@flyde/flow-editor/dist/styles/tailwind.scss";
import "@flyde/flow-editor/src/index.scss";
import {
  EditorVisualNode,
  FlydeFlow,
  DebuggerEvent,
  noop,
} from "@flyde/core";
import { createEditorClient } from "@flyde/remote-debugger";

declare global {
  interface Window {
    acquireVsCodeApi?: () => any;
  }
}

const vscode = window.acquireVsCodeApi?.();

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

  const debuggerUrl = `http://localhost:${port}`;
  
  const debuggerClient = useMemo(() => {
    return createEditorClient(debuggerUrl, executionId);
  }, [debuggerUrl, executionId]);

  const runtimePlayer = useMemo(() => {
    return createRuntimePlayer({
      onBatchedEvents: debuggerClient.onBatchedEvents,
      onRuntimeError: (error) => {
        console.error("Runtime error:", error);
      },
      onRuntimeReady: debuggerClient.onRuntimeReady,
      requestState: debuggerClient.requestState,
    });
  }, [debuggerClient]);

  // Debounced flow change handler for saving to VS Code
  const debouncedFlowChange = useDebounce((flow: FlydeFlow) => {
    if (vscode) {
      vscode.postMessage({
        type: "setFlow",
        requestId: `flow-${Date.now()}`,
        params: { flow },
      });
    }
  }, 500);

  const handleFlowChange = useCallback((newState: FlowEditorState) => {
    setEditorState(newState);
    debouncedFlowChange(newState.flow);
  }, [debouncedFlowChange]);

  // Listen for external flow changes from VS Code
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === "onExternalFlowChange") {
        const { flow } = message.params;
        setEditorState(prev => ({
          ...prev,
          flow,
        }));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // VS Code ports integration
  const ports = useMemo(() => {
    if (!vscode) return {};

    const createPortFn = (type: string) => (...params: any[]) => {
      return new Promise((resolve, reject) => {
        const requestId = `${type}-${Date.now()}-${Math.random()}`;
        
        const handleResponse = (event: MessageEvent) => {
          const message = event.data;
          if (message.requestId === requestId) {
            window.removeEventListener("message", handleResponse);
            if (message.status === "success") {
              resolve(message.payload);
            } else {
              reject(new Error(message.payload?.message || "Request failed"));
            }
          }
        };

        window.addEventListener("message", handleResponse);
        
        vscode.postMessage({
          type,
          requestId,
          params: params.length === 1 ? params[0] : params,
        });
      });
    };

    return {
      prompt: createPortFn("prompt"),
      confirm: createPortFn("confirm"),
      openFile: createPortFn("openFile"),
      readFlow: createPortFn("readFlow"),
      generateNodeFromPrompt: createPortFn("generateNodeFromPrompt"),
      onInstallRuntimeRequest: createPortFn("onInstallRuntimeRequest"),
      onRunFlow: createPortFn("onRunFlow"),
      hasOpenAiToken: createPortFn("hasOpenAiToken"),
      reportEvent: createPortFn("reportEvent"),
      getLibraryData: createPortFn("getLibraryData"),
      onRequestSiblingNodes: createPortFn("onRequestSiblingNodes"),
      onCreateCustomNode: createPortFn("onCreateCustomNode"),
      createAiCompletion: createPortFn("createAiCompletion"),
      resolveInstance: createPortFn("resolveInstance"),
      getAvailableSecrets: createPortFn("getAvailableSecrets"),
      addNewSecret: createPortFn("addNewSecret"),
    };
  }, []);

  return (
    <DarkModeProvider value={darkMode}>
      <DebuggerContextProvider 
        value={{
          onRequestHistory: debuggerClient.getHistory,
          debuggerClient,
        }}
      >
        <div className="vscode-flow-editor" style={{ height: "100vh", width: "100vw" }}>
          <FlowEditor
            state={editorState}
            onChangeEditorState={setEditorState}
            darkMode={darkMode}
          />
        </div>
      </DebuggerContextProvider>
    </DarkModeProvider>
  );
};