import * as React from "react";
import {
  isVisualPart,
  Pos,
  VisualPart,
  isInlineValuePart,
  PartInstance,
  FlydeFlow,
  ImportedPartDef,
  InlinePartInstance,
  PinType,
  DebuggerEventType,
  ROOT_INS_ID,
} from "@flyde/core";
import {
  VisualPartEditor,
  ClipboardData,
  defaultViewPort,
  GroupEditorBoardData,
  PART_HEIGHT,
  VisualPartEditorHandle,
} from "../visual-part-editor/VisualPartEditor";
import produce from "immer";
import { useHotkeys } from "../lib/react-utils/use-hotkeys";

// ;
import { createNewPartInstance } from "../visual-part-editor/utils";

import { AppToaster, toastMsg } from "../toaster";

import {
  FlydeFlowChangeType,
  functionalChange,
} from "./flyde-flow-change-type";
import { Omnibar, OmniBarCmd, OmniBarCmdType } from "./omnibar/Omnibar";

import { usePorts } from "./ports";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { vAdd } from "../physics";
import { DataInspectionModal } from "./DataInspectionModal";
import { useDebuggerContext } from "./DebuggerContext";
import { useDependenciesContext } from "./DependenciesContext";

export * from "./ports";
export * from "./DebuggerContext";
export * from "./DependenciesContext";

library.add(fab, fas);

export type FlowEditorState = {
  flow: FlydeFlow;
  boardData: GroupEditorBoardData;
};

export type FlydeFlowEditorProps = {
  state: FlowEditorState;
  onChangeEditorState: React.Dispatch<React.SetStateAction<FlowEditorState>>;

  onNewEnvVar?: (name: string, val: any) => void;

  onExtractInlinePart: (ins: InlinePartInstance) => Promise<void>;

  ref?: React.Ref<any>;

  hideTemplatingTips?: boolean;

  initialPadding?: [number, number];
};

const maxUndoStackSize = 50;

export type ConstTargetData = {
  ins?: PartInstance;
  pinId?: string;
  pos: Pos;
};

export type DataBuilderTarget = {
  partId: string;
  src: string;
};

const ignoreUndoChangeTypes = ["select", "drag-move", "order-step"];

export const FlowEditor: React.FC<FlydeFlowEditorProps> = React.memo(
  React.forwardRef((props, visualEditorRef) => {
    const { state, onChangeEditorState } = props;

    const { resolvedDependencies, onImportPart } = useDependenciesContext();

    const [undoStack, setUndoStack] = React.useState<
      Partial<FlowEditorState>[]
    >([]);
    const [redoStack, setRedoStack] = React.useState<
      Partial<FlowEditorState>[]
    >([]);

    const { flow, boardData: editorBoardData } = state;
    const editedPart = state.flow.part;

    const [queuedInputsData, setQueuedInputsData] = React.useState<
      Record<string, Record<string, number>>
    >({});

    const [instancesWithErrors, setInstancesWithErrors] = React.useState<
      Set<string>
    >(new Set());

    const { debuggerClient } = useDebuggerContext();

    React.useEffect(() => {
      if (debuggerClient) {
        return debuggerClient.onBatchedEvents((events) => {
          events.forEach((event) => {
            if (event.type === DebuggerEventType.INPUTS_STATE_CHANGE) {
              console.log("INPUTS_STATE_CHANGE", event.insId, event.val);
              setQueuedInputsData((obj) => {
                return { ...obj, [event.insId]: event.val };
              });
            }

            if (event.type === DebuggerEventType.ERROR) {
              setInstancesWithErrors((set) => {
                const newSet = new Set(set);
                newSet.add(event.insId);
                return newSet;
              });
            }
          });
        });
      }
      return undefined;
    }, [debuggerClient]);

    const { openFile, reportEvent } = usePorts();

    const onChangeFlow = React.useCallback(
      (newFlow: Partial<FlydeFlow>, changeType: FlydeFlowChangeType) => {
        console.info("onChangeFlow", changeType.type);

        if (changeType.type === "functional") {
          setUndoStack([
            { flow: { ...state.flow, ...newFlow } },
            ...undoStack.slice(0, maxUndoStackSize),
          ]);
          setRedoStack([]);
        }
        onChangeEditorState((state) => ({
          ...state,
          flow: { ...state.flow, ...newFlow },
        }));
      },
      [onChangeEditorState, state.flow, undoStack]
    );

    const [clipboardData, setClipboardData] = React.useState<ClipboardData>({
      instances: [],
      connections: [],
    });

    const [omniBarVisible, setOmnibarVisible] = React.useState(false);

    const hideOmnibar = React.useCallback(() => setOmnibarVisible(false), []);
    const showOmnibar = React.useCallback(() => setOmnibarVisible(true), []);

    const onChangeEditorBoardData = React.useCallback(
      (partial: Partial<GroupEditorBoardData>) => {
        onChangeEditorState((state) => {
          return { ...state, boardData: { ...state.boardData, ...partial } };
        });
      },
      [onChangeEditorState]
    );

    // clear board data that isn't related to part when it changes
    React.useEffect(() => {
      onChangeEditorBoardData({
        selected: [],
        viewPort: defaultViewPort,
        from: undefined,
        to: undefined,
        lastMousePos: { x: 0, y: 0 },
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editedPart.id]);

    useHotkeys(
      "cmd+z",
      (e) => {
        setRedoStack([...redoStack, state]);
        const [last, ...rest] = undoStack;
        if (last) {
          onChangeEditorState((state) => ({ ...state, ...last }));
          setUndoStack(rest);
        }
        e.preventDefault();
      },
      { text: "Undo last change", group: "Editing" },
      [state, undoStack, redoStack]
    );

    const onChangePart = React.useCallback(
      (newPart: VisualPart, changeType: FlydeFlowChangeType) => {
        const shouldIgnore = ignoreUndoChangeTypes.some((str) =>
          changeType.message.includes(str)
        );
        if (!shouldIgnore) {
          setRedoStack([]);
        }

        onChangeFlow({ part: newPart }, changeType);
      },
      [onChangeFlow]
    );

    const onEditPart = React.useCallback(
      (part: ImportedPartDef) => {
        openFile({ absPath: part.source.path });
      },
      [openFile]
    );

    const onAddPartInstance = React.useCallback(
      (partId: string, offset: number = -1 * PART_HEIGHT * 1.5) => {
        const newPartIns = createNewPartInstance(
          partId,
          offset,
          editorBoardData.lastMousePos,
          resolvedDependencies
        );
        if (newPartIns) {
          const valueChanged = produce(flow, (draft) => {
            const part = draft.part;
            if (!isVisualPart(part)) {
              throw new Error(
                `Impossible state, adding part to non visual part`
              );
            }
            part.instances.push(newPartIns);
          });
          onChangeFlow(valueChanged, functionalChange("add-part"));
          hideOmnibar();
          return newPartIns;
        }
      },
      [
        editorBoardData.lastMousePos,
        flow,
        onChangeFlow,
        hideOmnibar,
        resolvedDependencies,
      ]
    );

    const onOmnibarCmd = React.useCallback(
      async (cmd: OmniBarCmd) => {
        switch (cmd.type) {
          case OmniBarCmdType.ADD:
            reportEvent("addPart", { partId: cmd.data, source: "omnibar" });
            return onAddPartInstance(cmd.data);
          case OmniBarCmdType.ADD_VALUE: {
            const ref: VisualPartEditorHandle | undefined = (
              visualEditorRef as any
            ).current;
            ref?.requestNewInlineValue();

            break;
          }
          case OmniBarCmdType.IMPORT: {
            await onImportPart(cmd.data, { pos: editorBoardData.lastMousePos });
            const finalPos = vAdd({ x: 0, y: 0 }, editorBoardData.lastMousePos);
            const newPartIns = createNewPartInstance(
              cmd.data.part,
              0,
              finalPos,
              resolvedDependencies
            );
            const newValue = produce(flow, (draft) => {
              draft.part.instances.push(newPartIns);
            });
            onChangeFlow(newValue, functionalChange("add-imported-part"));
            reportEvent("addPart", {
              partId: cmd.data.part.id,
              source: "omnibar",
            });
            break;
          }
          default:
            AppToaster.show({
              intent: "warning",
              message: "Not supported yet",
            });
        }
        hideOmnibar();
      },
      [
        hideOmnibar,
        reportEvent,
        onAddPartInstance,
        onImportPart,
        editorBoardData.lastMousePos,
        resolvedDependencies,
        flow,
        onChangeFlow,
      ]
    );

    const [inspectedItem, setInspectedItem] = React.useState<{
      insId: string;
      pin?: { type: PinType; id: string };
    }>();

    const onCloseInspectedItemModal = React.useCallback(
      () => setInspectedItem(undefined),
      []
    );

    const onInspectPin = React.useCallback(
      (insId: string, pin: { type: PinType; id: string }) => {
        setInspectedItem({ insId, pin });
      },
      []
    );

    const renderInner = () => {
      if (isInlineValuePart(editedPart)) {
        throw new Error("Impossible state");
      } else {
        return (
          <React.Fragment>
            {inspectedItem ? (
              <DataInspectionModal
                item={inspectedItem}
                onClose={onCloseInspectedItemModal}
              />
            ) : null}
            <VisualPartEditor
              currentInsId={ROOT_INS_ID}
              ref={visualEditorRef}
              key={editedPart.id}
              boardData={editorBoardData}
              onChangeBoardData={onChangeEditorBoardData}
              part={editedPart}
              onGoToPartDef={onEditPart}
              onChangePart={onChangePart}
              resolvedDependencies={resolvedDependencies}
              clipboardData={clipboardData}
              onCopy={setClipboardData}
              partIoEditable={!editedPart.id.startsWith("Trigger")}
              onInspectPin={onInspectPin}
              onShowOmnibar={showOmnibar}
              onExtractInlinePart={props.onExtractInlinePart}
              queuedInputsData={queuedInputsData}
              initialPadding={props.initialPadding}
              instancesWithErrors={instancesWithErrors}
            />

            {omniBarVisible ? (
              <Omnibar
                flow={flow}
                resolvedParts={resolvedDependencies}
                onCommand={onOmnibarCmd}
                visible={omniBarVisible}
                onClose={hideOmnibar}
              />
            ) : null}
          </React.Fragment>
        );
      }
    };

    return <div className="flyde-flow-editor">{renderInner()}</div>;
  })
);