import * as React from "react";
import "./App.scss";

import { EditorVisualNode, FlydeFlow, isVisualNode } from "@flyde/core";

import classNames from "classnames";
import {
  createEditorClient,
  EditorDebuggerClient,
} from "@flyde/flow-editor";

import {
  DebuggerContextData,
  DebuggerContextProvider,
  usePorts,
} from "@flyde/flow-editor"; // ../../common/visual-node-editor/utils

import { FlowEditor } from "@flyde/flow-editor"; // ../../common/flow-editor/FlowEditor

import { useDebouncedCallback } from "use-debounce";

import { PinType } from "@flyde/core";
import { createRuntimePlayer, RuntimePlayer } from "@flyde/flow-editor"; // ../../common/visual-node-editor/runtime-player

// import { useDevServerApi } from "../api/dev-server-api";
import { FlydeFlowChangeType } from "@flyde/flow-editor"; // ../../common/flow-editor/flyde-flow-change-type
import { FlowEditorState } from "@flyde/flow-editor"; // ../../common/lib/react-utils/use-hotkeys
import { defaultViewPort } from "@flyde/flow-editor/dist/visual-node-editor/VisualNodeEditor";
// import { vscodePromptHandler } from "../vscode-ports";
import { useEffect } from "react";
import _ from "lodash";
import { useBootstrapData } from "./use-bootstrap-data";

export const PIECE_HEIGHT = 28;

export type IntegratedFlowManagerProps = {
  // user: string;
  node: EditorVisualNode;
  integratedSource: string;
  port: number;
  executionId: string;
};

export const IntegratedFlowManager: React.FC<IntegratedFlowManagerProps> = (
  props
) => {
  const { node: initialNode, executionId } = props;
  const boardRef = React.useRef<any>();

  const ports = usePorts();

  // const searchParams = useSearchParams();
  const bootstrapData = useBootstrapData();
  const isEmbedded = !!bootstrapData;

  const lastChangeReason = React.useRef("");

  const [editorState, setEditorState] = React.useState<FlowEditorState>({
    flow: { node: initialNode },
    boardData: {
      viewPort: defaultViewPort,
      lastMousePos: { x: 0, y: 0 },
      selectedInstances: [],
      selectedConnections: [],
    },
  });

  const { flow } = editorState;

  const [debuggerClient, setDebuggerClient] =
    React.useState<EditorDebuggerClient>();

  const runtimePlayer = React.useRef<RuntimePlayer>();

  const didMount = React.useRef(false);

  useEffect(() => {
    return ports.onExternalFlowChange(({ flow }) => {
      /*
       this is triggered from either vscode or in the future from  filesystem watcher when outside of an IDE
      */
      if (_.isEqual(flow, editorState.flow) === false) {
        setEditorState((state) => ({ ...state, flow }));

        lastChangeReason.current = "external-changes";
      }
    });
  }, [editorState.flow, ports]);

  const connectToRemoteDebugger = React.useCallback(
    (url: string) => {
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
    },
    [debuggerClient, executionId]
  );

  React.useEffect(() => {
    document.title = `${props.integratedSource} | ${flow.node.id} | Flyde`;

    connectToRemoteDebugger("http://localhost:" + props.port);

    return () => {
      document.title = `Flyde`;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (debuggerClient) {
      return debuggerClient.onBatchedEvents((events) => {
        if (runtimePlayer.current) {
          console.info(`Batched events - ${events.length} into player`, events);
          runtimePlayer.current.addEvents(events);
        } else {
          console.info(
            `Batched events - ${events.length} but no player`,
            events
          );
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

  const onChangeFlow = React.useCallback(
    async (changedFlow: { node: EditorVisualNode }, type: FlydeFlowChangeType) => {
      console.log("onChangeFlow", type);
      lastChangeReason.current = type.message;
      setEditorState((state) => ({ ...state, flow: changedFlow }));
      debouncedSaveFile(changedFlow, props.integratedSource);
    },
    [props.integratedSource, debouncedSaveFile]
  );

  React.useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
    } else {
      if (lastChangeReason.current !== "external-changes") {
        debouncedSaveFile(editorState.flow, props.integratedSource);
        lastChangeReason.current = "n/a";
      }
    }
  }, [
    onChangeFlow,
    editorState.flow,
    debouncedSaveFile,
    props.integratedSource,
  ]);

  const _onRequestHistory = React.useCallback(
    (insId: string, pinId?: string, pinType?: PinType) => {
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

  const debuggerContextValue = React.useMemo<DebuggerContextData>(
    () => ({
      onRequestHistory: _onRequestHistory,
      debuggerClient,
    }),
    [_onRequestHistory, debuggerClient]
  );

  return (
    <div className={classNames("app", { embedded: isEmbedded })}>
      <main>
        <div className={classNames("stage-wrapper", { running: false })}>
          <DebuggerContextProvider value={debuggerContextValue}>
            <FlowEditor
              darkMode={bootstrapData?.darkMode}
              key={props.integratedSource}
              state={editorState}
              onChangeEditorState={setEditorState}
              ref={boardRef}
            />
          </DebuggerContextProvider>
        </div>
      </main>
    </div>
  );
};
