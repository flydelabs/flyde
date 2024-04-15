import * as React from "react";
import "./App.scss";

import {
  FlydeFlow,
  ImportableSource,
  isInlineNodeInstance,
  isMacroNodeInstance,
  NodeLibraryData,
  ResolvedDependenciesDefinitions,
} from "@flyde/core";

import classNames from "classnames";
import {
  createEditorClient,
  EditorDebuggerClient,
} from "@flyde/remote-debugger/dist/client";

import produce from "immer";
import {
  createNewNodeInstance,
  DebuggerContextData,
  DebuggerContextProvider,
  DependenciesContextData,
  DependenciesContextProvider,
  usePorts,
} from "@flyde/flow-editor"; // ../../common/visual-node-editor/utils
import { vAdd } from "@flyde/flow-editor"; // ../../common/physics

import { FlowEditor } from "@flyde/flow-editor"; // ../../common/flow-editor/FlowEditor

import { useDebouncedCallback } from "use-debounce";

import { IntegratedFlowSideMenu } from "./side-menu";
import { NodeDefinition } from "@flyde/core";

import { AppToaster } from "@flyde/flow-editor"; // ../../common/toaster

import { values } from "@flyde/flow-editor"; // ../../common/utils
import { PinType } from "@flyde/core";
import { createRuntimePlayer, RuntimePlayer } from "@flyde/flow-editor"; // ../../common/visual-node-editor/runtime-player

// import { useDevServerApi } from "../api/dev-server-api";
import { FlydeFlowChangeType, functionalChange } from "@flyde/flow-editor"; // ../../common/flow-editor/flyde-flow-change-type
import { FlowEditorState } from "@flyde/flow-editor"; // ../../common/lib/react-utils/use-hotkeys
import { defaultViewPort } from "@flyde/flow-editor/dist/visual-node-editor/VisualNodeEditor";
// import { vscodePromptHandler } from "../vscode-ports";
import { useState } from "react";
import { useEffect } from "react";
import _ from "lodash";
import { useBootstrapData } from "./use-bootstrap-data";
import type { ImportablesResult } from "@flyde/dev-server";

export const PIECE_HEIGHT = 28;

export type IntegratedFlowManagerProps = {
  // user: string;
  flow: FlydeFlow;
  integratedSource: string;
  resolvedDependencies: ResolvedDependenciesDefinitions;
  port: number;
  executionId: string;
};

export const IntegratedFlowManager: React.FC<IntegratedFlowManagerProps> = (
  props
) => {
  const { flow: initialFlow, resolvedDependencies, executionId } = props;
  const boardRef = React.useRef<any>();

  const ports = usePorts();

  // const searchParams = useSearchParams();
  const bootstrapData = useBootstrapData();
  const isEmbedded = !!bootstrapData;

  const [currentResolvedDeps, setCurrentResolvedDeps] =
    useState(resolvedDependencies);

  const lastChangeReason = React.useRef("");

  const [libraryData, setLibraryData] = React.useState<NodeLibraryData>({
    groups: [],
  });

  useEffect(() => {
    ports.getLibraryData().then((data) => {
      setLibraryData(data);
    });
  }, [ports]);

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

  const [debuggerClient, setDebuggerClient] =
    React.useState<EditorDebuggerClient>();

  const runtimePlayer = React.useRef<RuntimePlayer>();

  const [menuSelectedItem, setMenuSelectedItem] = React.useState<string>();

  // to avoid re-resolving imported flows, this holds nodes that were imported in the current session
  const [importedNodes, setImportedNodes] = React.useState<ImportableSource[]>(
    []
  );

  const didMount = React.useRef(false);

  useEffect(() => {
    setCurrentResolvedDeps((deps) => ({
      ...deps,
      [flow.node.id]: { ...flow.node, source: { path: "n/a", export: "n/a" } },
    }));
  }, [flow.node]);

  useEffect(() => {
    return ports.onExternalFlowChange(({ flow, deps }) => {
      /*
       this is triggered from either vscode or in the future from  filesystem watcher when outside of an IDE
      */
      if (_.isEqual(flow, editorState.flow) === false) {
        setCurrentResolvedDeps(deps);
        setEditorState((state) => ({ ...state, flow }));

        lastChangeReason.current = "external-changes";
      }
    });
  }, [editorState.flow, ports]);

  const lastInstancesMacroData = React.useRef<any>([]);

  useEffect(() => {
    // syncs macro data from instances to the resolved deps
    const insMacroDatas = flow.node.instances.flatMap((ins) => {
      if (isMacroNodeInstance(ins)) {
        return ins.macroData;
      } else if (isInlineNodeInstance(ins)) {
        // hack so this covers also inline nodes, probably inefficient (such as everything in this section)
        return ins.node;
      } else {
        return [];
      }
    });

    if (!_.isEqual(insMacroDatas, lastInstancesMacroData.current)) {
      lastInstancesMacroData.current = insMacroDatas;
      ports
        .resolveDeps({
          flow: editorState.flow,
          relativePath: props.integratedSource,
        })
        .then((deps) => {
          setCurrentResolvedDeps(deps);
        });
    }
  }, [editorState.flow, flow.node.instances, ports, props.integratedSource]);

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

  const debouncedSaveFile = useDebouncedCallback((flow, src: string) => {
    ports.setFlow({ absPath: src, flow });
  }, 500);

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
        const deps = await ports.resolveDeps({
          relativePath: props.integratedSource,
        });
        setCurrentResolvedDeps(deps);
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

  const onAddNodeToStage = (node: NodeDefinition) => {
    const finalPos = vAdd({ x: 100, y: 0 }, editorState.boardData.lastMousePos);
    const newNodeIns = createNewNodeInstance(
      node.id,
      0,
      finalPos,
      currentResolvedDeps
    );
    if (newNodeIns) {
      const valueChanged = produce(flow, (draft) => {
        const node = draft.node;

        node.instances.push(newNodeIns);
      });
      onChangeFlow(valueChanged, functionalChange("add-item"));
    }

    AppToaster.show({ message: `Added ${node.id} on last cursor position` });
  };

  const onFocusInstance = React.useCallback((insId: string) => {
    if (boardRef.current) {
      boardRef.current.centerInstance(insId);
    }
  }, []);

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
    importables: ImportableSource[];
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

      setImportedNodes((nodes) => [...nodes, importableNode]);

      const newDeps = {
        ...resolvedDependencies,
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

      return newDeps;
    },
    [editorState, flow, onChangeState, resolvedDependencies]
  );

  const onExtractInlineNode = React.useCallback(async () => {}, []);

  React.useEffect(() => {
    const _importedNodes = importedNodes.reduce((acc, curr) => {
      return {
        ...acc,
        [curr.node.id]: { ...curr.node, importPath: curr.module },
      };
    }, {});

    setCurrentResolvedDeps((deps) => {
      return {
        ...deps,
        ..._importedNodes,
      };
    });
  }, [importedNodes]);

  const debuggerContextValue = React.useMemo<DebuggerContextData>(
    () => ({
      onRequestHistory: _onRequestHistory,
      debuggerClient,
    }),
    [_onRequestHistory, debuggerClient]
  );

  const dependenciesContextValue = React.useMemo<DependenciesContextData>(
    () => ({
      resolvedDependencies: currentResolvedDeps,
      onImportNode,
      onRequestImportables: queryImportables,
      libraryData,
    }),
    [currentResolvedDeps, onImportNode, queryImportables, libraryData]
  );

  return (
    <div className={classNames("app", { embedded: isEmbedded })}>
      <DependenciesContextProvider value={dependenciesContextValue}>
        <main>
          <IntegratedFlowSideMenu
            flowPath={props.integratedSource}
            // editedNode={editedNode}
            flow={flow}
            // onDeleteNode={onDeleteCustomNode}
            onAdd={onAddNodeToStage}
            // onAddNode={onAddNode}
            // onRenameNode={onRenameNode}
            selectedMenuItem={menuSelectedItem}
            setSelectedMenuItem={setMenuSelectedItem}
            editorDebugger={debuggerClient}
            onFocusInstance={onFocusInstance}
            onChangeFlow={onChangeFlow}
          />
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
