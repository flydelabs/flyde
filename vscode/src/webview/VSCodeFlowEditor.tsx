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
} from "@flyde/editor";
import "@flyde/editor/dist/styles/tailwind.scss";
import "@flyde/editor/src/index.scss";
import {
  FlydeFlow,
  isVisualNode,
} from "@flyde/core";
import { createEditorClient, EditorDebuggerClient } from "@flyde/editor";
import { createVsCodePorts } from "./vscode-ports";
import {
  applyImportPathMoves,
  createImportPathMapper,
} from "./importPathReplacements";
import type { ImportPathMoveContext } from "./importPathReplacements";
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

// Global variable to store debugger events during testing
declare global {
  interface Window {
    __testCapturedDebuggerEvents?: any[];
  }
}

export const VSCodeFlowEditor: React.FC<BootstrapData> = ({
  initialNode,
  port,
  relativeFile,
  executionId,
  darkMode
}) => {
  // Check if we're in test mode (either dummy data or vscode test environment)
  const isDummyMode = new URLSearchParams(window.location.search).get('dummy') === 'true';
  const isVSCodeTest = relativeFile && relativeFile.includes('HelloWorld.flyde');
  const isTestMode = isDummyMode || isVSCodeTest;

  // Initialize test event capture
  React.useEffect(() => {
    if (isTestMode) {
      window.__testCapturedDebuggerEvents = [];
    }
  }, [isTestMode]);
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
  const [importPathMoves, setImportPathMoves] =
    useState<ImportPathMoveContext>();
  const runtimePlayer = useRef<RuntimePlayer>();
  const lastChangeReason = useRef<string>("");
  const didMount = useRef(false);
  const editorStateRef = useRef(editorState);

  // Update the latest flow synchronously. A move can arrive directly after an
  // edit, before React has rendered that edit; reading only the rendered flow
  // would miss the new instance and let the pending save write a stale path.
  const updateEditorState = useCallback(
    (action: React.SetStateAction<FlowEditorState>) => {
      const next =
        typeof action === "function"
          ? (action as (state: FlowEditorState) => FlowEditorState)(
              editorStateRef.current
            )
          : action;
      editorStateRef.current = next;
      setEditorState(next);
    },
    []
  );

  const ports = useMemo(() => createVsCodePorts(), []);
  const mapImportPath = useMemo(
    () =>
      importPathMoves
        ? createImportPathMapper(importPathMoves)
        : undefined,
    [importPathMoves]
  );

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
        // Capture events for testing
        if (isTestMode && window.__testCapturedDebuggerEvents) {
          window.__testCapturedDebuggerEvents.push(...events);
        }

        if (runtimePlayer.current) {
          console.info(`Batched events - ${events.length} into player`, events);
          runtimePlayer.current.addEvents(events);
        } else {
          console.info(`Batched events - ${events.length} but no player`, events);
        }
      });
    }
  }, [debuggerClient, isTestMode]);

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
      if (isEqual(flow, editorStateRef.current.flow) === false) {
        updateEditorState((state) => ({ ...state, flow }));
        lastChangeReason.current = "external-changes";
      }
    });
  }, [ports, updateEditorState]);

  useEffect(() => {
    return ports.onImportPathsMoved?.((data) => {
      if (data.moves.length === 0) {
        return;
      }

      const current = editorStateRef.current.flow;
      const nextNode = applyImportPathMoves(current.node, data);
      const nextFlow = { ...current, node: nextNode };
      const nodeChanged = nextNode !== current.node;
      setImportPathMoves(data);
      lastChangeReason.current = "external-changes";
      updateEditorState((state) => ({ ...state, flow: nextFlow }));

      if (nodeChanged) {
        // A save for an older flow may already be queued. Replacing it with
        // the repaired flow keeps unsaved duplicates from reintroducing the
        // stale path half a second later.
        debouncedSaveFile.cancel();
        debouncedSaveFile(nextFlow, relativeFile);
      }
    });
  }, [debouncedSaveFile, ports, relativeFile]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    if (lastChangeReason.current === "external-changes") {
      lastChangeReason.current = "n/a";
      return;
    }

    debouncedSaveFile(editorState.flow, relativeFile);
    lastChangeReason.current = "n/a";
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
              onChangeEditorState={updateEditorState}
              darkMode={darkMode}
              mapImportPath={mapImportPath}
            />
          </div>
        </DebuggerContextProvider>
      </PortsContext.Provider>
    </DarkModeProvider>
  );
};