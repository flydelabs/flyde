import * as React from "react";
import "./App.scss";

import {
  FlydeFlow,
  ImportablePart,
  TRIGGER_PIN_ID,
  PartInstance,
  ResolvedDependenciesDefinitions,
  PartDefRepo,
} from "@flyde/core";

import classNames from "classnames";
import {
  createEditorClient,
  EditorDebuggerClient,
} from "@flyde/remote-debugger/dist/client";

import produce from "immer";
import { createNewPartInstance, FlydeFlowEditorProps, usePorts } from "@flyde/flow-editor"; // ../../common/visual-part-editor/utils
import { vAdd } from "@flyde/flow-editor"; // ../../common/physics

import { FlowEditor } from "@flyde/flow-editor"; // ../../common/flow-editor/FlowEditor

import { useDebouncedCallback } from "use-debounce";

import { IntegratedFlowSideMenu } from "./side-menu";
import { CustomPart, isInlineValuePart, PartDefinition } from "@flyde/core";

import { AppToaster, toastMsg } from "@flyde/flow-editor"; // ../../common/toaster

import { values } from "@flyde/flow-editor"; // ../../common/utils
import { PinType } from "@flyde/core";
import { createRuntimePlayer, RuntimePlayer } from "@flyde/flow-editor"; // ../../common/visual-part-editor/runtime-player

// import { useDevServerApi } from "../api/dev-server-api";
import { FlydeFlowChangeType, functionalChange } from "@flyde/flow-editor"; // ../../common/flow-editor/flyde-flow-change-type
import { FlowEditorState } from "@flyde/flow-editor"; // ../../common/lib/react-utils/use-hotkeys
import { defaultViewPort } from "@flyde/flow-editor/dist/visual-part-editor/VisualPartEditor";
// import { vscodePromptHandler } from "../vscode-ports";
import { useState } from "react";
import { useEffect } from "react";
import _ from "lodash";
import { useBootstrapData } from "./use-bootstrap-data";

export const PIECE_HEIGHT = 28;

export type IntegratedFlowManagerProps = {
  // user: string;
  flow: FlydeFlow;
  integratedSource: string;
  resolvedDependencies: ResolvedDependenciesDefinitions;
  port: number;
};

export const IntegratedFlowManager: React.FC<IntegratedFlowManagerProps> = (
  props
) => {
  const { flow: initialFlow, resolvedDependencies } = props;
  const boardRef = React.useRef<any>();

  const ports = usePorts();

  // const searchParams = useSearchParams();
  const bootstrapData = useBootstrapData();
  const isEmbedded = !!bootstrapData;

  const [currentResolvedDeps, setCurrentResolvedDeps] =
    useState(resolvedDependencies);

  const lastChangeReason = React.useRef("");

  const [editorState, setEditorState] = React.useState<FlowEditorState>({
    flow: initialFlow,
    boardData: {
      viewPort: defaultViewPort,
      lastMousePos: { x: 0, y: 0 },
      selected: [],
    },
  });

  const { flow } = editorState;

  const [debuggerClient, setDebuggerClient] =
    React.useState<EditorDebuggerClient>();

  const runtimePlayer = React.useRef<RuntimePlayer>();

  const [inspectedPin, setInspectPin] = React.useState<{
    insId: string;
    pinId: string;
    pinType: PinType;
  }>();

  const [menuSelectedItem, setMenuSelectedItem] = React.useState<string>();

  // to avoid re-resolving imported flows, this holds parts that were imported in the current session
  const [importedParts, setImportedParts] = React.useState<ImportablePart[]>(
    []
  );

  const [repo, setRepo] = useState<PartDefRepo>({
    ...currentResolvedDeps,
    [flow.part.id]: flow.part,
  });

  const didMount = React.useRef(false);

  useEffect(() => {
    setRepo({
      ...currentResolvedDeps,
      [flow.part.id]: flow.part,
    });
  }, [currentResolvedDeps, flow.part]);

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

  const connectToRemoteDebugger = React.useCallback(
    (url: string) => {
      const newClient = createEditorClient(url, "integrated-mode");

      if (debuggerClient) {
        debuggerClient.destroy();
      }

      setDebuggerClient(newClient);
      if (runtimePlayer.current) {
        runtimePlayer.current.destroy();
      }
      const newPlayer = createRuntimePlayer(`${flow.part.id}`);
      runtimePlayer.current = newPlayer;

      (window as any).__runtimePlayer = runtimePlayer;

      const dt = 0;
      runtimePlayer.current.start(dt);
    },
    [debuggerClient, flow]
  );

  React.useEffect(() => {
    document.title = `${props.integratedSource} | ${flow.part.id} | Flyde`;

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
      console.log("onChangeState", type, changedState);
      lastChangeReason.current = type.message;
      setEditorState(changedState);
      debouncedSaveFile(changedState.flow, props.integratedSource);
    },
    [props.integratedSource, debouncedSaveFile]
  );


  const onChangeFlow = React.useCallback(
    (changedFlow: FlydeFlow, type: FlydeFlowChangeType) => {
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

  const onInspectPin = React.useCallback(
    (insId: string, pinId: string, pinType: PinType) => {
      setMenuSelectedItem("analytics");
      setInspectPin({ insId, pinId, pinType });
    },
    []
  );

  const onAddPartToStage = (part: PartDefinition) => {
    const finalPos = vAdd({ x: 100, y: 0 }, editorState.boardData.lastMousePos);
    const newPartIns = createNewPartInstance(part.id, 0, finalPos, repo);
    if (newPartIns) {
      const valueChanged = produce(flow, (draft) => {
        const part = draft.part;
        if (isInlineValuePart(part)) {
          AppToaster.show({ message: "cannot add part to code part" });
        } else {
          part.instances.push(newPartIns);
        }
      });
      onChangeFlow(valueChanged, functionalChange("add-item"));
    }

    AppToaster.show({ message: `Added ${part.id} on last cursor position` });
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
      });
    },
    [debuggerClient]
  );

  const queryImportables = React.useCallback(async (): Promise<
    ImportablePart[]
  > => {
    const importables = await ports
      .getImportables({
        rootFolder: props.integratedSource,
        flowPath: props.integratedSource,
      })
      .then((imps) => {
        return Object.entries(imps).reduce<any[]>((acc, [module, partsMap]) => {
          const parts = values(partsMap);
          const partAndModule = parts.map((part) => ({ module, part }));
          return acc.concat(partAndModule);
        }, []);
      });

    return [...importables];
  }, [ports, props.integratedSource]);

  const onImportPart = React.useCallback<FlydeFlowEditorProps['onImportPart']>(
    async (
      { part: importedPart, module },
      target
    ): Promise<PartInstance | undefined> => {
      const existingModuleImports = (flow.imports || {})[module] || [];

      setImportedParts((parts) => [...parts, { part: importedPart, module }]);

      let newPartIns: PartInstance | undefined = undefined;

      const newFlow = produce(flow, (draft) => {
        if (target) {
          const finalPos = vAdd({ x: 0, y: 0 }, target.pos);
          newPartIns = createNewPartInstance(importedPart, 0, finalPos, repo);
          draft.part.instances.push(newPartIns);

          if (target.connectTo) {
            const { insId, outputId } = target.connectTo;
            draft.part.connections.push({
              from: {
                insId,
                pinId: outputId,
              },
              to: {
                insId: newPartIns.id,
                pinId: TRIGGER_PIN_ID,
              },
            });
          }
        }

        const imports = draft.imports || {};
        const modImports = imports[module] || [];

        if (!existingModuleImports.includes(importedPart.id)) {
          modImports.push(importedPart.id);
        }

        imports[module] = modImports;
        draft.imports = imports;
      });


      // yacky hack to make sure flow is only rerendered when the new part exists
      await new Promise((resolve) => setTimeout(resolve, 10));

      const newState = produce(editorState, (draft) => {
        draft.flow = newFlow;
        if (target?.selectAfterAdding && newPartIns) {
          draft.boardData.selected = [newPartIns?.id];
        }
      });

      onChangeState(newState, functionalChange("imported-part"));

      toastMsg(`Part ${importedPart.id} successfully imported from ${module}`);
      return newPartIns;
    },
    [editorState, flow, onChangeState, repo]
  );

  const onExtractInlinePart = React.useCallback(async () => {}, []);

  React.useEffect(() => {
    const importedPartsRepo = importedParts.reduce((acc, curr) => {
      return {
        ...acc,
        [curr.part.id]: { ...curr.part, importPath: curr.module },
      };
    }, {});

    setCurrentResolvedDeps((deps) => {
      return {
        ...deps,
        ...importedPartsRepo,
      };
    });
  }, [importedParts]);

  return (
    <div className={classNames("app", { embedded: isEmbedded })}>
      <main>
        <IntegratedFlowSideMenu
          flowPath={props.integratedSource}
          // editedPart={editedPart}
          repo={repo}
          flow={flow}
          resolvedParts={repo}
          // onDeletePart={onDeleteCustomPart}
          onAdd={onAddPartToStage}
          // onAddPart={onAddPart}
          // onRenamePart={onRenamePart}
          inspectedPin={inspectedPin}
          selectedMenuItem={menuSelectedItem}
          setSelectedMenuItem={setMenuSelectedItem}
          editorDebugger={debuggerClient}
          onFocusInstance={onFocusInstance}
          onChangeFlow={onChangeFlow}
        />
        <div className={classNames("stage-wrapper", { running: false })}>
          <FlowEditor
            key={props.integratedSource}
            state={editorState}
            onChangeEditorState={setEditorState}
            hideTemplatingTips={false}
            onInspectPin={onInspectPin}
            onRequestHistory={_onRequestHistory}
            resolvedDependencies={currentResolvedDeps}
            onQueryImportables={queryImportables}
            onImportPart={onImportPart}
            onExtractInlinePart={onExtractInlinePart}
            ref={boardRef}
          />
        </div>
      </main>
    </div>
  );
};
