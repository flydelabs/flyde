import * as React from "react";
import "./App.scss";

import { FlydeFlow, isVisualNode, NodeLibraryData } from "@flyde/core";

import classNames from "classnames";
import {
  createEditorClient,
  EditorDebuggerClient,
} from "@flyde/remote-debugger/dist/client";

import produce from "immer";
import {
  DebuggerContextData,
  DebuggerContextProvider,
  DependenciesContextData,
  DependenciesContextProvider,
  usePorts,
} from "@flyde/flow-editor"; // ../../common/visual-node-editor/utils

import { FlowEditor } from "@flyde/flow-editor"; // ../../common/flow-editor/FlowEditor

import { useDebouncedCallback } from "use-debounce";

import { ImportablesResult } from "@flyde/core";

import { values } from "@flyde/flow-editor"; // ../../common/utils
import { PinType } from "@flyde/core";
import { createRuntimePlayer, RuntimePlayer } from "@flyde/flow-editor"; // ../../common/visual-node-editor/runtime-player

// import { useDevServerApi } from "../api/dev-server-api";
import { FlydeFlowChangeType, functionalChange } from "@flyde/flow-editor"; // ../../common/flow-editor/flyde-flow-change-type
import { FlowEditorState } from "@flyde/flow-editor"; // ../../common/lib/react-utils/use-hotkeys
import { defaultViewPort } from "@flyde/flow-editor/dist/visual-node-editor/VisualNodeEditor";
// import { vscodePromptHandler } from "../vscode-ports";
import { useEffect } from "react";
import _ from "lodash";
import { useBootstrapData } from "./use-bootstrap-data";

export const PIECE_HEIGHT = 28;

export type IntegratedFlowManagerProps = {
  // user: string;
  flow: FlydeFlow;
  integratedSource: string;
  port: number;
  executionId: string;
};

export const IntegratedFlowManager: React.FC<IntegratedFlowManagerProps> = (
  props
) => {
  const { flow: initialFlow, executionId } = props;
  const boardRef = React.useRef<any>();

  const ports = usePorts();

  // const searchParams = useSearchParams();
  const bootstrapData = useBootstrapData();
  const isEmbedded = !!bootstrapData;

  const lastChangeReason = React.useRef("");

  const [libraryData, setLibraryData] = React.useState<NodeLibraryData>({
    groups: [],
  });

  const [editorState, setEditorState] = React.useState<FlowEditorState>({
    flow: initialFlow,
    boardData: {
      viewPort: defaultViewPort,
      lastMousePos: { x: 0, y: 0 },
      selectedInstances: [],
      selectedConnections: [],
    },
  });

  const { flow } = editorState;

  useEffect(() => {
    ports.getLibraryData().then((data) => {
      setLibraryData(data);
    });
  }, [ports]);

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

  const onChangeState = React.useCallback(
    (changedState: FlowEditorState, type: FlydeFlowChangeType) => {
      lastChangeReason.current = type.message;
      setEditorState(changedState);
      debouncedSaveFile(changedState.flow, props.integratedSource);
    },
    [debouncedSaveFile, props.integratedSource]
  );

  const onChangeFlow = React.useCallback(
    async (changedFlow: FlydeFlow, type: FlydeFlowChangeType) => {
      console.log("onChangeFlow", type);
      lastChangeReason.current = type.message;
      setEditorState((state) => ({ ...state, flow: changedFlow }));
      if (type.message.includes("macro")) {
        await ports.setFlow({
          absPath: props.integratedSource,
          flow: changedFlow,
        });
      } else {
        debouncedSaveFile(changedFlow, props.integratedSource);
      }
    },
    [ports, props.integratedSource, debouncedSaveFile]
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

  const queryImportables = React.useCallback(async (): Promise<{
    importables: any[];
    errors: ImportablesResult["errors"];
  }> => {
    return await ports
      .getImportables({
        rootFolder: props.integratedSource,
        flowPath: props.integratedSource,
      })
      .then((imps) => {
        const { importables, errors } = imps;

        const newImportables = Object.entries(importables).reduce<any[]>(
          (acc, [module, nodesMap]) => {
            const nodes = values(nodesMap);
            const nodeAndModule = nodes.map((node) => ({ module, node }));
            return acc.concat(nodeAndModule);
          },
          []
        );
        return { importables: [...newImportables], errors };
      });
  }, [ports, props.integratedSource]);

  const onImportNode = React.useCallback<
    DependenciesContextData["onImportNode"]
  >(
    async (importableNode) => {
      const existingModuleImports =
        (flow.imports || {})[importableNode.module] || [];

      // setImportedNodes((nodes) => [...nodes, importableNode]);

      const newDeps = {
        [importableNode.node.id]: importableNode.node,
      };

      const newFlow = produce(flow, (draft) => {
        const imports = draft.imports || {};
        const modImports = imports[importableNode.module] || [];

        if (!existingModuleImports.includes(importableNode.node.id)) {
          modImports.push(importableNode.node.id);
        }

        imports[importableNode.module] = modImports;
        draft.imports = imports;
      });

      const newState = produce(editorState, (draft) => {
        draft.flow = newFlow;
      });

      onChangeState(newState, functionalChange("imported-node"));

      return newDeps as any;
    },
    [editorState, flow, onChangeState]
  );

  const onExtractInlineNode = React.useCallback(async () => {}, []);

  const debuggerContextValue = React.useMemo<DebuggerContextData>(
    () => ({
      onRequestHistory: _onRequestHistory,
      debuggerClient,
    }),
    [_onRequestHistory, debuggerClient]
  );

  const onRequestSiblingNodes = React.useCallback<
    DependenciesContextData["onRequestSiblingNodes"]
  >(
    (macro) => {
      return ports.onRequestSiblingNodes({ macro });
    },
    [ports]
  );

  const dependenciesContextValue = React.useMemo<DependenciesContextData>(
    () => ({
      onImportNode,
      onRequestImportables: queryImportables,
      libraryData,
      onRequestSiblingNodes,
    }),
    [onImportNode, queryImportables, libraryData, onRequestSiblingNodes]
  );

  return (
    <div className={classNames("app", { embedded: isEmbedded })}>
      <DependenciesContextProvider value={dependenciesContextValue}>
        <main>
          <div className={classNames("stage-wrapper", { running: false })}>
            <DebuggerContextProvider value={debuggerContextValue}>
              <FlowEditor
                darkMode={bootstrapData?.darkMode}
                key={props.integratedSource}
                state={editorState}
                onChangeEditorState={setEditorState}
                onExtractInlineNode={onExtractInlineNode}
                ref={boardRef}
              />
            </DebuggerContextProvider>
          </div>
        </main>
      </DependenciesContextProvider>
    </div>
  );
};
