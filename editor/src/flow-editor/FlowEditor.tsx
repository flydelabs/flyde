import * as React from "react";
import {
  Pos,
  VisualNode,
  NodeInstance,
  PinType,
  DebuggerEventType,
  ROOT_INS_ID,
  EditorVisualNode,
} from "@flyde/core";
import {
  VisualNodeEditor,
  ClipboardData,
  defaultViewPort,
  GroupEditorBoardData,
} from "../visual-node-editor/VisualNodeEditor";

import { useHotkeys } from "../lib/react-utils/use-hotkeys";

import { FlydeFlowChangeType } from "./flyde-flow-change-type";

import { usePorts } from "./ports";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { DataInspectionModal } from "./DataInspectionModal";
import { useDebuggerContext } from "./DebuggerContext";
import { DarkModeProvider } from "./DarkModeContext";
import { useDarkMode } from "usehooks-ts";

import { VisualNodeEditorProvider } from "../visual-node-editor/VisualNodeEditorContext";
import { AiCompletionContext, AiCompletionProvider } from "../ui";

export * from "./ports";
export * from "./DebuggerContext";

library.add(fab, fas);

export type FlowEditorState = {
  flow: { node: EditorVisualNode };
  boardData: GroupEditorBoardData;
};

export type FlydeFlowEditorProps = {
  state: FlowEditorState;
  onChangeEditorState: React.Dispatch<React.SetStateAction<FlowEditorState>>;

  onNewEnvVar?: (name: string, val: any) => void;

  ref?: React.Ref<any>;

  initialPadding?: [number, number];
  darkMode?: boolean;
  requireModifierForZoom?: boolean;

  comparisonNode?: VisualNode;
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

    const [undoStack, setUndoStack] = React.useState<
      Partial<FlowEditorState>[]
    >([]);
    const [redoStack, setRedoStack] = React.useState<
      Partial<FlowEditorState>[]
    >([]);

    const { boardData: editorBoardData } = state;
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
              setQueuedInputsData((obj) => {
                return { ...obj, [event.insId]: event.val as Record<string, number> };
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

    const { createAiCompletion } = usePorts();

    const onChangeFlow = React.useCallback(
      (newFlow: { node: EditorVisualNode }, changeType: FlydeFlowChangeType) => {
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
        selectedInstances: [],
        viewPort: defaultViewPort,
        from: undefined,
        to: undefined,
        lastMousePos: { x: 0, y: 0 },
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editedNode.id]);

    useHotkeys(
      "cmd+z, ctrl+z",
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
      (newNode: EditorVisualNode, changeType: FlydeFlowChangeType) => {
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

    const [inspectedItem, setInspectedItem] = React.useState<{
      insId: string;
      pin: { type: PinType; id: string };
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

    const AiCompletionContextValue = React.useMemo<AiCompletionContext>(() => {
      return {
        createCompletion: createAiCompletion ?? (() => Promise.resolve('')),
        enabled: !!createAiCompletion,
      };
    }, [createAiCompletion]);

    const renderInner = () => {
      return (
        <DarkModeProvider value={props.darkMode ?? isDarkMode}>
          <AiCompletionProvider value={AiCompletionContextValue}>
            <VisualNodeEditorProvider
              boardData={editorBoardData}
              onChangeBoardData={onChangeEditorBoardData}
              node={editedNode}
              onChangeNode={onChangeNode}
            >
              <React.Fragment>
                {inspectedItem && (
                  <DataInspectionModal
                    item={inspectedItem}
                    isOpen={!!inspectedItem}
                    onClose={onCloseInspectedItemModal}
                  />
                )}
                <VisualNodeEditor
                  currentInsId={ROOT_INS_ID}
                  ref={visualEditorRef}
                  key={editedNode.id}
                  clipboardData={clipboardData}
                  onCopy={setClipboardData}
                  nodeIoEditable={!editedNode.id.startsWith("Trigger")}
                  onInspectPin={onInspectPin}
                  queuedInputsData={queuedInputsData}
                  initialPadding={props.initialPadding}
                  instancesWithErrors={instancesWithErrors}
                  tempFlow={state.flow}
                  requireModifierForZoom={props.requireModifierForZoom}
                />
              </React.Fragment>
            </VisualNodeEditorProvider>
          </AiCompletionProvider>
        </DarkModeProvider>
      );
    };

    return <div className="flyde-flow-editor">{renderInner()}</div>;
  })
);
