import * as React from "react";
import "./App.scss";

import {
  okeys,
  FlydeFlow,
  keys,
  ExposedFunctionality,
  ResolvedFlydeFlowDefinition,
  ImportablePart,
  isInlinePartInstance,
  isRefPartInstance,
} from "@flyde/core";

import classNames from "classnames";
import { createEditorClient, EditorDebuggerClient } from "@flyde/remote-debugger/dist/client";

import produce from "immer";
import { IntegratedFlowHeader } from "./flow-header";
import { createNewPartInstance } from "@flyde/flow-editor"; // ../../common/grouped-part-editor/utils
import { vAdd } from "@flyde/flow-editor"; // ../../common/physics

import { FlowEditor } from "@flyde/flow-editor"; // ../../common/flow-editor/FlowEditor

import { useDebouncedCallback } from "use-debounce";

import { IntegratedFlowSideMenu } from "./side-menu";
import {
  CustomPart,
  isCodePart,
  isGroupedPart,
  PartDefinition,
  partInput,
  partOutput,
} from "@flyde/core";

import { AppToaster, toastMsg } from "@flyde/flow-editor"; // ../../common/toaster

import { useQueryParam, StringParam, BooleanParam } from "use-query-params";
import { values } from "@flyde/flow-editor"; // ../../common/utils
import { PinType } from "@flyde/core";
import { createRuntimePlayer, RuntimePlayer } from "@flyde/flow-editor"; // ../../common/grouped-part-editor/runtime-player
import { buildPartsRelationshipData, PartsRelationshipData } from "@flyde/flow-editor"; // ../../common/lib/part-relationship-data

import { useDevServerApi } from "../api/apis-context";
import { FlydeFlowChangeType, functionalChange } from "@flyde/flow-editor"; // ../../common/flow-editor/flyde-flow-change-type
import { useHotkeys, FlowEditorState } from "@flyde/flow-editor"; // ../../common/lib/react-utils/use-hotkeys
import { defaultViewPort } from "@flyde/flow-editor/dist/grouped-part-editor/GroupedPartEditor";
import { vscodePromptHandler } from "../vscode-prompt-handler";

export const PIECE_HEIGHT = 28;

export type IntegratedFlowManagerProps = {
  // user: string;
  flow: FlydeFlow;
  initialPart: CustomPart;
  integratedSource: string;
  resolvedDefinitions: ResolvedFlydeFlowDefinition;
  port: number;
};

export const IntegratedFlowManager: React.FC<IntegratedFlowManagerProps> = (props) => {
  const { flow: initialFlow, resolvedDefinitions } = props;
  const boardRef = React.useRef<any>();
  // const searchParams = useSearchParams();

  const [editedPartQuery, setEditedPartQuery] = useQueryParam("editedPartId", StringParam);

  const [isEmbeddedMode] = useQueryParam("embedded", BooleanParam);

  const [state, setState] = React.useState<FlowEditorState>({
    flow: initialFlow,
    currentPartId: props.initialPart.id,
    boardData: {
      viewPort: defaultViewPort,
      lastMousePos: { x: 0, y: 0 },
      selected: [],
    },
  });

  const { flow } = state;

  const [resolvedRepoWithDeps, setResolvedRepoWithDeps] =
    React.useState<ResolvedFlydeFlowDefinition>({ ...resolvedDefinitions, ...flow.parts });

  const [relationshipData, setRelationshipData] = React.useState<PartsRelationshipData>(
    buildPartsRelationshipData(flow)
  );

  const [debuggerClient, setDebuggerClient] = React.useState<EditorDebuggerClient>();

  const runtimePlayer = React.useRef<RuntimePlayer>();

  const [editedPartId, setEditedPartId] = React.useState(props.initialPart.id);

  const [inspectedPin, setInspectPin] = React.useState<{
    insId: string;
    pinId: string;
    pinType: PinType;
  }>();

  const [menuSelectedItem, setMenuSelectedItem] = React.useState<string>();

  // to avoid re-resolving imported flows, this holds parts that were imported in the current session
  const [importedParts, setImportedParts] = React.useState<ImportablePart[]>([]);

  const devServerClient = useDevServerApi();

  const getFirstPart = React.useCallback(() => {
    const firstPartId = keys(flow.parts)[0];
    const firstPart = flow.parts[firstPartId];
    if (!firstPart) {
      throw new Error("No parts in flow");
    }
    return firstPart;
  }, [flow.parts]);

  const getEditedPart = React.useCallback((): CustomPart => {
    const customPart = flow.parts[editedPartId];
    if (customPart) {
      return customPart;
    } else {
      const firstPart = getFirstPart();
      toastMsg(
        'No part with id "' + editedPartId + '" found. Falling back to "' + firstPart.id + '"'
      );
      setEditedPartId(firstPart.id);
      return firstPart;
    }
  }, [editedPartId, flow.parts, getFirstPart]);

  const editedPart = getEditedPart();

  const [exposedFunc, setExposedFunc] = React.useState<ExposedFunctionality[]>([]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      devServerClient.exposed().then((func) => {
        const newKeys = new Set(func.map((f) => f.displayName));
        const existingKeys = new Set(exposedFunc.map((f) => f.displayName));

        const hasChanged =
          newKeys.size !== existingKeys.size ||
          Array.from(newKeys).some((x) => !existingKeys.has(x));

        if (hasChanged) {
          setExposedFunc(func);
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  });

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
      const newPlayer = createRuntimePlayer(`root.${editedPartId}`);
      runtimePlayer.current = newPlayer;

      (window as any).__runtimePlayer = runtimePlayer;

      const dt = 0;
      runtimePlayer.current.start(dt);
    },
    [debuggerClient, editedPartId]
  );

  React.useEffect(() => {
    document.title = `${props.integratedSource} | ${editedPartId} | Flyde`;

    connectToRemoteDebugger("http://localhost:" + props.port);

    return () => {
      document.title = `Flyde`;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useHotkeys(
    "cmd+s",
    (e) => {
      toastMsg("Flows are auto saved to disk");
      e.preventDefault();
    },
    []
  );

  React.useEffect(() => {
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

  const debouncedSaveFile = useDebouncedCallback((flow, src: string) => {
    // saving exposed like this is a bit hacky, but it works for now
    devServerClient.saveFile(src, { ...flow, exposedFunctionality: exposedFunc });
  }, 500);

  const onChangeFlow = React.useCallback(
    (changedFlow: FlydeFlow, type: FlydeFlowChangeType) => {
      // console.log("project change", type);
      setState((state) => ({ ...state, flow: changedFlow }));
      debouncedSaveFile(changedFlow, props.integratedSource);
      setRelationshipData(buildPartsRelationshipData(changedFlow));
    },
    [props.integratedSource, debouncedSaveFile]
  );

  React.useEffect(() => {
    onChangeFlow(state.flow, functionalChange('unknown'));
  }, [onChangeFlow, state.flow]);

  const onInspectPin = React.useCallback((insId: string, pinId: string, pinType: PinType) => {
    setMenuSelectedItem("analytics");
    setInspectPin({ insId, pinId, pinType });
  }, []);

  const onAddPartToStage = (part: PartDefinition) => {
    const finalPos = vAdd({ x: 100, y: 0 }, state.boardData.lastMousePos);
    const newPartIns = createNewPartInstance(part, 0, finalPos, flow.parts);
    if (newPartIns) {
      const valueChanged = produce(flow, (draft) => {
        const part = draft.parts[editedPartId]!;
        if (isCodePart(part)) {
          AppToaster.show({ message: "cannot add part to code part" });
        } else {
          part.instances.push(newPartIns);
        }
      });
      onChangeFlow(valueChanged, functionalChange("add-item"));
    }

    AppToaster.show({ message: `Added ${part.id} on last cursor position` });
  };

  const onAddPart = React.useCallback(
    (part: CustomPart) => {
      const valueChanged = produce(flow, (draft) => {
        draft.parts[part.id] = part;
      });
      onChangeFlow(valueChanged, functionalChange("add-item"));
      AppToaster.show({ message: `New part added ${part.id}` });
    },
    [onChangeFlow, flow]
  );

  const onEditPart = React.useCallback(
    async (partOrId: CustomPart | string) => {
      const part = typeof partOrId === "string" ? flow.parts[partOrId] : partOrId;

      if (!part) {
        throw new Error("WAT");
      }

      setEditedPartQuery(part.id);
      setEditedPartId(part.id);
    },
    [flow.parts, setEditedPartQuery]
  );

  const onFocusInstance = React.useCallback((insId: string) => {
    if (boardRef.current) {
      boardRef.current.centerInstance(insId);
    }
  }, []);

  React.useEffect(() => {
    const partId = editedPartQuery;
    if (partId && partId !== editedPartId) {
      const part = flow.parts[partId];
      if (!part) {
        alert("Part not found");

        const firstPart = getFirstPart();
        if (firstPart) {
          onEditPart(firstPart);
        } else {
          throw new Error("Impossible state");
        }
      }
    }
  }, [editedPartQuery, editedPartId, onEditPart, flow, getFirstPart]);

  const onDeleteCustomPart = React.useCallback(
    (part: CustomPart) => {
      // eslint-disable-next-line no-restricted-globals
      if (confirm("Are you sure?")) {
        const parts = values(flow.parts).filter((_part) => {
          if (isGroupedPart(_part)) {
            return (
              _part.instances.filter((ins) => isRefPartInstance(ins) && ins.partId === part.id && _part.id !== part.id)
                .length > 0
            );
          } else {
            return false;
          }
        });

        if (parts.length) {
          console.info(`Existing parts:`, parts);
          if (
            !confirm(
              `Found ${parts.length} parts with instances that are still using ${
                part.id
              }. Are you sure you want to remove it? They are: ${parts.map((p) => p.id)}`
            )
          ) {
            return;
          }
        }

        const newProject = produce(flow, (draft) => {
          delete draft.parts[part.id];
        });
        onEditPart(values(newProject.parts)[0]);

        onChangeFlow(newProject, functionalChange("delete part"));
        toastMsg("Part deleted");
        //
      }
    },
    [onChangeFlow, onEditPart, flow]
  );

  const onRenamePart = React.useCallback(
    (renamedPart: CustomPart) => {
      const newPartId = prompt("new part name?", renamedPart.id);

      if (!newPartId) {
        return;
      }

      if (flow.parts[newPartId]) {
        toastMsg(`Part with name ${newPartId} already exists in this project`);
        return;
      }

      // fix all instances using it
      let renames = 0;
      const newProject = produce(flow, (draft) => {
        okeys(draft.parts).forEach((partId) => {
          const p = draft.parts[partId];
          if (p && isGroupedPart(p)) {
            p.instances = p.instances.map((ins) => {
              if (!isInlinePartInstance(ins) &&  ins.partId === renamedPart.id) {
                renames++;
                return { ...ins, partId: newPartId };
              }
              return ins;
            });
            draft.parts[partId] = p;
          }
        });

        const oldId = renamedPart.id;
        draft.parts[newPartId] = { ...renamedPart, id: newPartId };
        delete draft.parts[oldId];
      });
      onChangeFlow(newProject, functionalChange("renamed-part"));
      if (getEditedPart().id === renamedPart.id) {
        const newPart = newProject.parts[newPartId];
        if (!newPart) {
          throw new Error("wat");
        }
        onEditPart(newPart);
      }
      toastMsg(`Renamed part and all its ${renames} usages`);
    },
    [flow, onChangeFlow, getEditedPart, onEditPart]
  );

  const onOverrideEditedPart = React.useCallback(
    (newPart: CustomPart) => {
      const newProject = produce(flow, (draft) => {
        draft.parts[editedPartId] = newPart;
      });

      onChangeFlow(newProject, functionalChange("override-part"));
    },
    [editedPartId, onChangeFlow, flow]
  );

  const _onRequestHistory = React.useCallback(
    (fullInsId: string, pinId: string, pinType: PinType) => {
      if (!debuggerClient) {
        return Promise.resolve({ total: 0, lastSamples: [] });
      }
      return debuggerClient.getHistory({ id: `${fullInsId}.${pinId}.${pinType}`, limit: 1 });
    },
    [debuggerClient]
  );

  const queryImportables = React.useCallback(
    async (query): Promise<ImportablePart[]> => {
      const importables = await devServerClient
        .getImportables(props.integratedSource)
        .then((imps) => {
          return Object.entries(imps).reduce<any[]>((acc, [module, partsMap]) => {
            const parts = values(partsMap);

            const importsFromModule = flow.imports[module] || [];
            const partAndModule = parts
              .filter(part => {
                return !importsFromModule.find(imp => imp.name === part.id);
              })
              .map((part) => ({ module, part }));
            return acc.concat(partAndModule);
          }, [])
        
        });

      return [...importables];
    },
    [devServerClient, flow.imports, props.integratedSource]
  );

  const onImportPart = React.useCallback(
    ({ part: importedPart, module }: ImportablePart) => {
      if (resolvedRepoWithDeps[importedPart.id]) {
        toastMsg(`Part with name ${importedPart.id} already exists in this project`, "danger");
        return;
      }

      const finalPos = vAdd({ x: 0, y: 0 }, state.boardData.lastMousePos);
      const newPartIns = createNewPartInstance(importedPart, 0, finalPos, flow.parts);

      setImportedParts((parts) => [...parts, { part: importedPart, module }]);

      const newFlow = produce(flow, (draft) => {
        const part = draft.parts[editedPart.id];
        if (!isGroupedPart(part)) {
          throw new Error(`Part ${editedPart.id} is not a grouped part`);
        }
        part.instances.push(newPartIns);
        draft.parts[editedPart.id] = part;

        const imports = draft.imports || {};
        const modImports = imports[module] || [];
      
        modImports.push({ name: importedPart.id, alias: importedPart.id });
        imports[module] = modImports;
        draft.imports = imports;
        modImports.push({ name: importedPart.id, alias: importedPart.id });
        imports[module] = modImports;
        draft.imports = imports;
      });

      // yacky hack to make sure flow is only rerendered when the new part exists
      setTimeout(() => {
        onChangeFlow(newFlow, functionalChange("imported-part"));
      }, 10);

      // onEditPart(part);
    },
    [editedPart.id, flow, onChangeFlow, resolvedRepoWithDeps, state.boardData.lastMousePos]
  );

  React.useEffect(() => {
    const exposedPartsDefinitions = exposedFunc.reduce((acc, func) => {
      const inputs = func.inputs.reduce((acc, curr) => {
        return { ...acc, [curr]: partInput("any") };
      }, {});
      const part = {
        id: func.displayName,
        inputs,
        outputs: { result: partOutput("any") },
        completionOutputs: ["result"],
      } as PartDefinition;

      return { ...acc, [part.id]: part };
    }, {});
    const importedPartsRepo = importedParts.reduce((acc, curr) => {
      return { ...acc, [curr.part.id]: curr.part };
    }, {});

    setResolvedRepoWithDeps({
      ...resolvedDefinitions,
      ...exposedPartsDefinitions,
      ...flow.parts,
      ...importedPartsRepo,
    });
  }, [importedParts, flow.parts, exposedFunc, resolvedDefinitions]);

  return (
    <div className={classNames("app", {embedded: isEmbeddedMode})}>
      <IntegratedFlowHeader
        flow={flow}
        part={editedPart}
        onChangeFlow={onChangeFlow}
        onOverrideEditedPart={onOverrideEditedPart}
        relationshipData={relationshipData}
        onChangeEditedPart={onEditPart}
      />

      <main>
        <IntegratedFlowSideMenu
          flowPath={props.integratedSource}
          partsRelationshipData={relationshipData}
          editedPart={editedPart}
          repo={flow.parts}
          flow={flow}
          resolvedParts={flow.parts}
          onEditPart={onEditPart}
          onDeletePart={onDeleteCustomPart}
          onAdd={onAddPartToStage}
          onAddPart={onAddPart}
          onRenamePart={onRenamePart}
          inspectedPin={inspectedPin}
          selectedMenuItem={menuSelectedItem}
          setSelectedMenuItem={setMenuSelectedItem}
          editorDebugger={debuggerClient}
          onFocusInstance={onFocusInstance}
          onChangeFlow={onChangeFlow}
        />
        <div className={classNames("stage-wrapper", { running: false })}>
          <FlowEditor
            promptHandler={isEmbeddedMode ? vscodePromptHandler : undefined}
            key={props.integratedSource}
            state={state}
            onChangeState={setState}
            hideTemplatingTips={false}
            onInspectPin={onInspectPin}
            onRequestHistory={_onRequestHistory}
            resolvedRepoWithDeps={resolvedRepoWithDeps}
            onQueryImportables={queryImportables}
            onImportPart={onImportPart}
            ref={boardRef}
          />
        </div>
      </main>
    </div>
  );
};
