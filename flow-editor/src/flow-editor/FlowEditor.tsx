import * as React from "react";
import {
  isVisualNode,
  Pos,
  VisualNode,
  isInlineValueNode,
  NodeInstance,
  FlydeFlow,
  ImportedNodeDef,
  InlineNodeInstance,
  PinType,
  DebuggerEventType,
  ROOT_INS_ID,
} from "@flyde/core";
import {
  VisualNodeEditor,
  ClipboardData,
  defaultViewPort,
  GroupEditorBoardData,
  NODE_HEIGHT,
  VisualNodeEditorHandle,
} from "../visual-node-editor/VisualNodeEditor";
import produce from "immer";
import { useHotkeys } from "../lib/react-utils/use-hotkeys";

// ;
import { createNewNodeInstance } from "../visual-node-editor/utils";

import { AppToaster } from "../toaster";

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
import { DarkModeProvider } from "./DarkModeContext";
import { useDarkMode } from "usehooks-ts";

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

  onExtractInlineNode: (ins: InlineNodeInstance) => Promise<void>;

  ref?: React.Ref<any>;

  hideTemplatingTips?: boolean;

  initialPadding?: [number, number];
  disableScrolling?: boolean;
  darkMode?: boolean;
};

const maxUndoStackSize = 50;

export type ConstTargetData = {
  ins?: NodeInstance;
  pinId?: string;
  pos: Pos;
};

export type DataBuilderTarget = {
  nodeId: string;
  src: string;
};

const ignoreUndoChangeTypes = ["select", "drag-move", "order-step"];

export const FlowEditor: React.FC<FlydeFlowEditorProps> = React.memo(
  React.forwardRef((props, visualEditorRef) => {
    const { state, onChangeEditorState } = props;

    const { resolvedDependencies, onImportNode } = useDependenciesContext();

    const [undoStack, setUndoStack] = React.useState<
      Partial<FlowEditorState>[]
    >([]);
    const [redoStack, setRedoStack] = React.useState<
      Partial<FlowEditorState>[]
    >([]);

    const { flow, boardData: editorBoardData } = state;
    const editedNode = state.flow.node;

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

    // clear board data that isn't related to node when it changes
    React.useEffect(() => {
      onChangeEditorBoardData({
        selected: [],
        viewPort: defaultViewPort,
        from: undefined,
        to: undefined,
        lastMousePos: { x: 0, y: 0 },
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editedNode.id]);

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

    const onChangeNode = React.useCallback(
      (newNode: VisualNode, changeType: FlydeFlowChangeType) => {
        const shouldIgnore = ignoreUndoChangeTypes.some((str) =>
          changeType.message.includes(str)
        );
        if (!shouldIgnore) {
          setRedoStack([]);
        }

        onChangeFlow({ node: newNode }, changeType);
      },
      [onChangeFlow]
    );

    const onEditNode = React.useCallback(
      (node: ImportedNodeDef) => {
        openFile({ absPath: node.source.path });
      },
      [openFile]
    );

    const onAddNodeInstance = React.useCallback(
      (nodeId: string, offset: number = -1 * NODE_HEIGHT * 1.5) => {
        const newNodeIns = createNewNodeInstance(
          nodeId,
          offset,
          editorBoardData.lastMousePos,
          resolvedDependencies
        );
        if (newNodeIns) {
          const valueChanged = produce(flow, (draft) => {
            const node = draft.node;
            if (!isVisualNode(node)) {
              throw new Error(
                `Impossible state, adding node to non visual node`
              );
            }
            node.instances.push(newNodeIns);
          });
          onChangeFlow(valueChanged, functionalChange("add-node"));
          hideOmnibar();
          return newNodeIns;
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
            reportEvent("addNode", { nodeId: cmd.data, source: "omnibar" });
            return onAddNodeInstance(cmd.data);
          case OmniBarCmdType.ADD_VALUE: {
            const ref: VisualNodeEditorHandle | undefined = (
              visualEditorRef as any
            ).current;
            ref?.requestNewInlineValue();

            break;
          }
          case OmniBarCmdType.IMPORT: {
            await onImportNode(cmd.data, { pos: editorBoardData.lastMousePos });
            const finalPos = vAdd({ x: 0, y: 0 }, editorBoardData.lastMousePos);
            const newNodeIns = createNewNodeInstance(
              cmd.data.node,
              0,
              finalPos,
              resolvedDependencies
            );
            const newValue = produce(flow, (draft) => {
              draft.node.instances.push(newNodeIns);
            });
            onChangeFlow(newValue, functionalChange("add-imported-node"));
            reportEvent("addNode", {
              nodeId: cmd.data.node.id,
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
        onAddNodeInstance,
        visualEditorRef,
        onImportNode,
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

    const { isDarkMode } = useDarkMode();

    const renderInner = () => {
      if (isInlineValueNode(editedNode)) {
        throw new Error("Impossible state");
      } else {
        return (
          <DarkModeProvider value={props.darkMode ?? isDarkMode}>
            <React.Fragment>
              {inspectedItem ? (
                <DataInspectionModal
                  item={inspectedItem}
                  onClose={onCloseInspectedItemModal}
                />
              ) : null}
              <VisualNodeEditor
                currentInsId={ROOT_INS_ID}
                ref={visualEditorRef}
                key={editedNode.id}
                boardData={editorBoardData}
                onChangeBoardData={onChangeEditorBoardData}
                node={editedNode}
                onGoToNodeDef={onEditNode}
                onChangeNode={onChangeNode}
                resolvedDependencies={resolvedDependencies}
                clipboardData={clipboardData}
                onCopy={setClipboardData}
                nodeIoEditable={!editedNode.id.startsWith("Trigger")}
                onInspectPin={onInspectPin}
                onShowOmnibar={showOmnibar}
                onExtractInlineNode={props.onExtractInlineNode}
                queuedInputsData={queuedInputsData}
                initialPadding={props.initialPadding}
                instancesWithErrors={instancesWithErrors}
                disableScrolling={props.disableScrolling}
              />

              {omniBarVisible ? (
                <Omnibar
                  flow={flow}
                  resolvedNodes={resolvedDependencies}
                  onCommand={onOmnibarCmd}
                  visible={omniBarVisible}
                  onClose={hideOmnibar}
                />
              ) : null}
            </React.Fragment>
          </DarkModeProvider>
        );
      }
    };

    return <div className="flyde-flow-editor">{renderInner()}</div>;
  })
);
