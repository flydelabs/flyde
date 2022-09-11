import * as React from "react";
import {
  PinType,
  isGroupedPart,
  Pos,
  GroupedPart,
  CustomPart,
  isCodePart,
  PartInstance,
  FlydeFlow,
  ResolvedFlydeFlowDefinition,
  ImportablePart,
  PartDefRepo,
} from "@flyde/core";
import {
  GroupedPartEditor,
  ClipboardData,
  defaultViewPort,
  GroupEditorBoardData,
  PART_HEIGHT,
} from "../grouped-part-editor/GroupedPartEditor";
import produce from "immer";
import { useHotkeys } from "../lib/react-utils/use-hotkeys";

// ;
import {
  createNewPartInstance,
  domToViewPort,
} from "../grouped-part-editor/utils";
import _ from "lodash";
import { HistoryPayload } from "@flyde/remote-debugger";
import { InlineCodeTarget } from "./inline-code-modal";
import { AppToaster, toastMsg } from "../toaster";

import { FlydeFlowChangeType, functionalChange } from "./flyde-flow-change-type";
import { handleCommand } from "./commands/commands";
import { EditorCommand } from "./commands/definition";
import { Omnibar, OmniBarCmd, OmniBarCmdType } from "./omnibar/Omnibar";
import { PromptContextProvider, PromptFunction } from "../lib/react-utils/prompt";

export type FlowEditorState = {
  flow: FlydeFlow;
  boardData: GroupEditorBoardData;
};

const defaultPromptHandler: PromptFunction = async (text, defaultValue) =>
  prompt(`${text}`, defaultValue);

export type FlydeFlowEditorProps = {
  state: FlowEditorState;
  onChangeState: React.Dispatch<React.SetStateAction<FlowEditorState>>;

  resolvedRepoWithDeps: ResolvedFlydeFlowDefinition;

  onImportPart: (part: ImportablePart) => void;
  onQueryImportables?: (query: string) => Promise<ImportablePart[]>;

  onInspectPin: (insId: string, pinId: string, pinType: PinType) => void;

  onRequestHistory: (insId: string, pinId: string, pinType: PinType) => Promise<HistoryPayload>;

  onNewEnvVar?: (name: string, val: any) => void;

  ref?: React.Ref<any>;

  hideTemplatingTips?: boolean;

  promptHandler?: PromptFunction;
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

const resolvedToRepo = (res: ResolvedFlydeFlowDefinition): PartDefRepo => ({
  ...res.dependencies,
  [res.main.id]: res.main
})

export const FlowEditor: React.FC<FlydeFlowEditorProps> = React.memo(
  React.forwardRef((props, ref) => {
    const { state, resolvedRepoWithDeps: resolvedFlow, onChangeState, onImportPart } = props;

    const [undoStack, setUndoStack] = React.useState<Partial<FlowEditorState>[]>([]);
    const [redoStack, setRedoStack] = React.useState<Partial<FlowEditorState>[]>([]);

    const { flow, boardData: editorBoardData } = state;
    const editedPart = state.flow.part;

    const promptHandler = props.promptHandler || defaultPromptHandler;

    const onChangeFlow = React.useCallback(
      (newFlow: FlydeFlow, changeType: FlydeFlowChangeType) => {
        console.log("onChangeFlow", changeType.type);

        if (changeType.type === "functional") {
          setUndoStack([{ flow: newFlow }, ...undoStack.slice(0, maxUndoStackSize)]);
          setRedoStack([]);
        }
        onChangeState((state) => ({ ...state, flow: newFlow }));
      },
      [onChangeState, undoStack]
    );

    const [clipboardData, setClipboardData] = React.useState<ClipboardData>({
      instances: [],
      connections: [],
    });

    const [editingConstValue, setEditingConstValue] = React.useState<{
      type: string;
      value: any;
      partId?: string;
    }>();

    const [constTarget, setConstTarget] = React.useState<ConstTargetData>();
    const [editedDataBuilder, setEditedDataBuilder] = React.useState<DataBuilderTarget>();

    // const [editorBoardData, setEditorBoardData] = React.useState<GroupEditorBoardData>({
    //   viewPort: defaultViewPort,
    //   selected: [],
    //   lastMousePos: { x: 0, y: 0 }
    // });

    const [omnibarVisible, setOmnibarVisible] = React.useState(false);

    const hideOmnibar = React.useCallback(() => setOmnibarVisible(false), []);
    const showOmnibar = React.useCallback(() => setOmnibarVisible(true), []);

    const onChangeEditorBoardData = React.useCallback(
      (partial: Partial<GroupEditorBoardData>) => {
        onChangeState((state) => ({ ...state, boardData: { ...state.boardData, ...partial } }));
      },
      [onChangeState]
    );

    const setEditedPart = React.useCallback(
      (part: CustomPart) => {
        onChangeState((state) => ({ ...state, currentPartId: part.id }));
      },
      [onChangeState]
    );

    const [inlineCodeTarget, setInlineCodeTarget] = React.useState<InlineCodeTarget>();

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
          onChangeState((state) => ({ ...state, ...last }));
          setUndoStack(rest);
        }
        e.preventDefault();
      },
      [state, undoStack, redoStack]
    );

    useHotkeys("a", (e) => {
      e.preventDefault();
      showOmnibar();
    });

    const onChangePart = React.useCallback(
      (newPart: GroupedPart, changeType: FlydeFlowChangeType) => {
        const shouldIgnore = ignoreUndoChangeTypes.some((str) => changeType.message.includes(str));
        if (!shouldIgnore) {
          setRedoStack([]);
        }

      
          const changedProject = produce(flow, (draft) => {
            draft.part = newPart;
          });

          onChangeFlow(changedProject, changeType);
      },
      [flow, onChangeFlow]
    );

    const onEditPart = React.useCallback(
      (partId: string) => {
        toastMsg('TODO');
      },
      []
    );

    // const editOrCreateConstValue = React.useCallback(
    //   (ins: PartInstance, pinId: string, type: string, pos: Pos, useInlineCode?: boolean) => {
    //     setConstTarget({ ins, pinId, pos });

    //     const config = ins.inputConfig[pinId];

    //     const maybePartId = isStaticInputPinConfig(config)
    //       ? maybeGetStaticValuePartId(config && config.value)
    //       : null;
    //     const maybePartToEdit = maybePartId ? flow.parts[maybePartId] : undefined;
    //     if (maybePartToEdit && isGroupedPart(maybePartToEdit)) {
    //       // edit the const part
    //       setEditedPart(maybePartToEdit);
    //     } else if (type.includes("part")) {
    //       // this means double clicking a part input, will generate a grouped part according to the specifications
    //       const { inputs, outputs } = parseInputOutputTypes(type);
    //       const newPart: GroupedPart = {
    //         id: `HOP_${ins.id}_${pinId}`,
    //         outputsPosition: {},
    //         inputsPosition: {},
    //         inputs,
    //         outputs,
    //         instances: [],
    //         connections: [],
    //       };

    //       const newProject = produce(flow, (draft) => {
    //         draft.parts[newPart.id] = newPart;

    //         const partToEdit = draft.parts[editedPart.id];

    //         if (!partToEdit) {
    //           throw new Error(`trying to edit inexisting part`);
    //         }
    //         if (!isGroupedPart(partToEdit)) {
    //           throw new Error(`trying to edit non grouped part`);
    //         }

    //         const instance = partToEdit.instances.find((_ins) => _ins.id === ins.id);
    //         if (!instance) {
    //           throw new Error(
    //             `trying to edit non exiting instance ${ins.id} in part ${editedPart.id}`
    //           );
    //         }

    //         instance.inputConfig[pinId] = staticInputPinConfig(staticPartRefence(newPart));
    //       });
    //       onChangeFlow(newProject, functionalChange("add-new-static-part"));
    //       setEditedPart(newPart);
    //     } else {
    //       // requesting "regular" const value

    //       if (useInlineCode) {
    //         setInlineCodeTarget({
    //           type: "new-connected",
    //           ins,
    //           pinId: pinId,
    //           pos: ins.pos,
    //         });
    //       } else {
    //         const config = ins.inputConfig[pinId];
    //         setEditingConstValue({
    //           type,
    //           value: config && isStaticInputPinConfig(config) ? config.value : 42,
    //         });
    //       }
    //     }
    //   },
    //   [setEditedPart, flow, onChangeFlow, editedPart.id]
    // );

    // const requestNewConstValue = React.useCallback((pos: Pos) => {
    //   setInlineCodeTarget({ pos, type: "new" });
    // }, []);

    // const onGroupPart = React.useCallback(async () => {
    //   const { selected } = editorBoardData;

    //   if (!selected.length) {
    //     console.info("tried to group without selection");
    //     return;
    //   }

    //   if (!isGroupedPart(editedPart)) {
    //     console.info("tried to group non grouped part");
    //     return;
    //   }

    //   const partName = await promptHandler("Name your new part");

    //   const { newPart, currentPart } = groupSelected(selected, editedPart, partName, 'ref');

    //   const newProject = produce(flow, (draft) => {
    //     draft.parts[newPart.id] = newPart;

    //     draft.parts[editedPart.id] = currentPart;
    //   });

    //   onChangeFlow(newProject, functionalChange("group part"));
    // }, [editorBoardData, editedPart, promptHandler, flow, onChangeFlow]);

    // const onFinishEditingConstValue = React.useCallback(
    //   (v: any, type: ValueBuilderType) => {
    //     if (!editingConstValue) {
    //       throw new Error("impossible state");
    //     }

    //     if (constTarget) {
    //       const { ins: insTarget, pinId } = constTarget;
    //       const placeholders = getConstValuePlaceholders(v);

    //       if (placeholders.length) {
    //         const builderFn =
    //           type === "string" ? createConstStringBuilderPart : createConstObjectBuilderPart;
    //         const newPart = builderFn({
    //           constValue: v,
    //           placeholders,
    //         });

    //         if (!newPart) {
    //           return;
    //         }

    //         if (flow.parts[newPart.id]) {
    //           toastMsg(`Part with id ${newPart.id} already exists`, "danger");
    //           return;
    //         }

    //         if (!isGroupedPart(editedPart)) {
    //           throw new Error(`finishing const value on non grouped part - ${editedPart.id}`);
    //         }

    //         const newPartIns = createNewPartInstance(newPart.id, -150, constTarget.pos, resolvedFlow);
    //         const valueWithPart = produce(editedPart, (draft) => {
    //           draft.instances.push(newPartIns);
    //         });

    //         if (insTarget && pinId) {
    //           const valueWithParthWithoutConst = produce(valueWithPart, (draft) => {
    //             const ins = draft.instances.find((i) => i.id === insTarget.id);
    //             if (!ins) {
    //               throw new Error(`Impossible state - no instance ${insTarget.id}`);
    //             }
    //             delete ins.inputConfig[pinId];
    //           });

    //           const withConnection = produce(valueWithParthWithoutConst, (draft) => {
    //             draft.connections.push({
    //               from: { insId: newPartIns.id, pinId: "r" },
    //               to: { insId: insTarget.id, pinId },
    //             });
    //           });

    //           const newProject = produce(flow, (draft) => {
    //             draft.parts[currentPartId] = withConnection;
    //             draft.parts[newPart.id] = newPart;
    //           });
    //           onChangeFlow(newProject, functionalChange("new value builder part"));
    //         } else {
    //           const newProject = produce(flow, (draft) => {
    //             draft.parts[editedPart.id] = valueWithPart;
    //             draft.parts[newPart.id] = newPart;
    //           });
    //           onChangeFlow(newProject, functionalChange("new value builder part"));
    //         }

    //         setConstTarget(undefined);
    //         setEditingConstValue(undefined);

    //         // console.log(placeholderMatches);
    //       } else {
    //         // here means we created a new const and want to also connect it to an existing part

    //         const newProject = produce(flow, (draft) => {
    //           const part = draft.parts[editedPart.id];

    //           if (!part || !isGroupedPart(part)) {
    //             throw new Error("impossible");
    //           }

    //           if (insTarget && pinId) {
    //             // means we're connecting it to an existing instance
    //             const ins = part.instances.find(({ id }) => insTarget.id === id);

    //             if (!ins) {
    //               throw new Error(
    //                 `cannot find instance ${insTarget.id} to apply const value changes`
    //               );
    //             }
    //             ins.inputConfig[pinId] = staticInputPinConfig(v);

    //             part.connections = part.connections.filter((conn) => {
    //               return !(conn.to.pinId === constTarget.pinId && conn.to.insId === insTarget.id);
    //             });
    //           } else {
    //             const newIns = partInstance(
    //               `const-val-${rnd(9999)}`,
    //               "Id",
    //               {
    //                 val: staticInputPinConfig(v),
    //               },
    //               constTarget.pos
    //             );

    //             part.instances.push(newIns);
    //             // we're adding it to the board inside an ID
    //           }
    //         });

    //         onChangeFlow(newProject, functionalChange("add new const part"));
    //         setConstTarget(undefined);
    //         setEditingConstValue(undefined);
    //       }
    //     } else {
    //       throw new Error("impossible state");
    //     }
    //   },
    //   [editingConstValue, constTarget, flow, editedPart, resolvedFlow, onChangeFlow, currentPartId]
    // );

    // const onFinishEditingDataBuilder = React.useCallback(
    //   (v: any, type) => {
    //     if (!editedDataBuilder) {
    //       throw new Error("impossible state");
    //     }
    //     const part = flow.parts[editedDataBuilder.partId];

    //     if (!part) {
    //       throw new Error(
    //         `impossible state no part ${editedDataBuilder.partId} to finish data builder editing`
    //       );
    //     }

    //     const { partId: dataPartId } = editedDataBuilder;

    //     const placeholders = getConstValuePlaceholders(v);
    //     const builderFn =
    //       type === "string" ? createConstStringBuilderPart : createConstObjectBuilderPart;
    //     const newPart = builderFn(
    //       {
    //         constValue: v,
    //         placeholders,
    //       },
    //       dataPartId
    //     );

    //     if (newPart.id !== editedDataBuilder.partId) {
    //       if (flow.parts[newPart.id]) {
    //         toastMsg(`Part with id ${newPart.id} already exists`, "danger");
    //         return;
    //       }
    //     }

    //     const oldInputs = keys(part.inputs);
    //     const newInputs = keys(newPart.inputs);

    //     const removedInputs = new Set(_.difference(oldInputs, newInputs));

    //     const newProject = produce(flow, (draft) => {
    //       draft.parts[dataPartId] = newPart;

    //       // remove connections from removed inputs
    //       for (const partId in draft.parts) {
    //         const _part = draft.parts[partId];
    //         if (_part && isGroupedPart(_part)) {
    //           const instancesOfValuePart = new Set(
    //             _part.instances
    //               .filter((ins) => isRefPartInstance(ins) && ins.partId === dataPartId)
    //               .map((ins) => ins.id)
    //           );
    //           _part.connections = _part.connections.filter((conn) => {
    //             const { insId, pinId } = conn.to;
    //             return !(instancesOfValuePart.has(insId) && removedInputs.has(pinId));
    //           });
    //           draft.parts[partId] = _part;
    //         }
    //       }
    //     });

    //     onChangeFlow(newProject, functionalChange("edited data builder part"));
    //     setEditedDataBuilder(undefined);
    //   },
    //   [editedDataBuilder, flow, onChangeFlow]
    // );

    // const onCancelEditingConstValue = () => setEditingConstValue(undefined);

    // const onCancelEditingDataBuilder = () => setEditedDataBuilder(undefined);

    // const onSaveInlineCodePart = React.useCallback(
    //   (type: CodePartTemplateTypeInline, code: string) => {
    //     if (!inlineCodeTarget) {
    //       throw new Error("Impossible state");
    //     }

    //     const customView = code.trim().substr(0, 100);

    //     if (inlineCodeTarget.type === "existing") {
    //       const newPart = createInlineCodePart({
    //         code,
    //         customView,
    //         partId: inlineCodeTarget.partId,
    //         type,
    //       });
    //       const existingPart = flow.parts[inlineCodeTarget.partId];

    //       if (!existingPart) {
    //         throw new Error(`Impossible state, no existing part ${inlineCodeTarget.partId}`);
    //       }

    //       const oldInputs = keys(existingPart.inputs);
    //       const newInputs = keys(newPart.inputs);

    //       const removedInputs = new Set(_.difference(oldInputs, newInputs));

    //       const newProject = produce(flow, (draft) => {
    //         draft.parts[existingPart.id] = newPart;

    //         // remove connections from removed inputs
    //         for (const partId in draft.parts) {
    //           const _part = draft.parts[partId];
    //           if (_part && isGroupedPart(_part)) {
    //             const instancesOfValuePart = new Set(
    //               _part.instances
    //                 .filter((ins) => isRefPartInstance(ins) && ins.partId === existingPart.id)
    //                 .map((ins) => ins.id)
    //             );
    //             _part.connections = _part.connections.filter((conn) => {
    //               const { insId, pinId } = conn.to;
    //               return !(instancesOfValuePart.has(insId) && removedInputs.has(pinId));
    //             });
    //             draft.parts[partId] = _part;
    //           }
    //         }
    //       });
    //       onChangeFlow(newProject, functionalChange("edited inline value code part"));
    //       toastMsg(`Inline code part edited`);
    //       if (removedInputs.size) {
    //         toastMsg(
    //           `Removal of inputs: ${Array.from(removedInputs).join(
    //             ", "
    //           )} detected. Removed matching connections.`
    //         );
    //       }
    //       setInlineCodeTarget(undefined);
    //     } else {
    //       const partId = `Inline-value-${customView.substr(0, 15).replace(/["'`]/g, '')}`
    //       const inlineCodePart = createInlineCodePart({ code, customView, type, partId});


    //       if (!isGroupedPart(editedPart)) {
    //         throw new Error(`Impossible state, no grouped part to add inline code part to`);
    //       }

    //       const newPartIns = createNewInlinePartInstance(
    //         inlineCodePart,
    //         150,
    //         inlineCodeTarget.pos,
    //         resolvedFlow
    //       );
    //       const valueWithPart = produce(editedPart, (draft) => {
    //         draft.instances.push(newPartIns);
    //       });

    //       const newPartInputs = keys(inlineCodePart.inputs);

    //       const newProject = produce(flow, (draft) => {

    //         if (inlineCodeTarget.type === "new-connected") {
    //           const pinToConnect = newPartInputs.includes(inlineCodeTarget.pinId)
    //             ? inlineCodeTarget.pinId
    //             : TRIGGER_PIN_ID;

    //           valueWithPart.connections.push(
    //             connectionData(
    //               `${inlineCodeTarget.ins.id}.${inlineCodeTarget.pinId}`,
    //               `${newPartIns.id}.${pinToConnect}`
    //             )
    //           );
    //         }

    //         draft.parts[valueWithPart.id] = valueWithPart;

    //         toastMsg(`Inline code part ${inlineCodePart.id} created`);
    //       });
    //       onChangeFlow(newProject, functionalChange("new value builder part"));
    //       setInlineCodeTarget(undefined);
    //     }
    //   },
    //   [inlineCodeTarget, flow, onChangeFlow, editedPart, resolvedFlow]
    // );

    const commandHandler = React.useCallback(
      (command: EditorCommand) => {
        if (!isGroupedPart(editedPart)) {
          throw new Error(`Impossible state, handling command handler on non grouped part`);
        }

        const newValue = handleCommand(command, {
          flow,
          boardData: editorBoardData,
          currentPartId: editedPart.id,
        });

        onChangeFlow(newValue.flow, functionalChange(command.type));
        onChangeEditorBoardData(newValue.boardData);
      },
      [editedPart, editorBoardData, flow, onChangeFlow, onChangeEditorBoardData]
    );

    const onAddPartInstance = React.useCallback(
      (partId: string, offset: number = -1 * PART_HEIGHT * 1.5) => {
        const newPartIns = createNewPartInstance(
          partId,
          offset,
          editorBoardData.lastMousePos,
          resolvedToRepo(resolvedFlow)
        );
        if (newPartIns) {
          const valueChanged = produce(flow, (draft) => {
            const part = draft.part;
            if (!isGroupedPart(part)) {
              throw new Error(`Impossible state, adding part to non grouped part`);
            }
            part.instances.push(newPartIns);
          });
          onChangeFlow(valueChanged, functionalChange("add-part"));
          hideOmnibar();
          return newPartIns;
        }
      },
      [editorBoardData.lastMousePos, flow, onChangeFlow, hideOmnibar, resolvedFlow]
    );

    const onOmnibarCmd = React.useCallback(
      (cmd: OmniBarCmd) => {
        switch (cmd.type) {
          case OmniBarCmdType.ADD:
            return onAddPartInstance(cmd.data);
          case OmniBarCmdType.ADD_VALUE:
            const pos = domToViewPort(editorBoardData.lastMousePos, editorBoardData.viewPort);
            toastMsg('TODO')
            // return requestNewConstValue(pos);
            break;
          case OmniBarCmdType.CREATE_CODE_PART:
            toastMsg('TODO')
            // onCreateNewPart("code");
            break;
          case OmniBarCmdType.CREATE_GROUPED_PART:
            toastMsg('TODO')
            // onCreateNewPart("grouped");
            break;
          case OmniBarCmdType.IMPORT:
            onImportPart(cmd.data);
            break;
          default:
            AppToaster.show({ intent: "warning", message: "Not supported yet" });
        }
        hideOmnibar();
      },
      [editorBoardData.lastMousePos, editorBoardData.viewPort, onAddPartInstance, hideOmnibar, onImportPart]
    );

    const renderInner = () => {
      if (isCodePart(editedPart)) {
        throw new Error('Impossible state')
        // return <CodePartEditor part={editedPart} onChange={onChangeCodePart} editMode={true} />;
      } else {
        return (
          <React.Fragment>
            <GroupedPartEditor
              insId={`root.${editedPart.id}`}
              ref={ref}
              key={editedPart.id}
              boardData={editorBoardData}
              onChangeBoardData={onChangeEditorBoardData}
              part={editedPart}
              onEditPart={onEditPart}
              // editOrCreateConstValue={editOrCreateConstValue}
              // requestNewConstValue={requestNewConstValue}
              // onGroupSelected={onGroupPart}
              onChangePart={onChangePart}
              resolvedFlow={resolvedFlow}
              // onToggleLog={props.onToggleLog}
              // onToggleBreakpoint={props.onToggleBreakpoint}
              clipboardData={clipboardData}
              onCopy={setClipboardData}
              partIoEditable={!editedPart.id.startsWith("Trigger")}
              onInspectPin={props.onInspectPin}
              onRequestHistory={props.onRequestHistory}
              onNewEnvVar={props.onNewEnvVar}
              onRequestImportables={props.onQueryImportables}
              onCommand={commandHandler}
              onShowOmnibar={showOmnibar}
            />
            {/* {editingConstValue ? (
              <ValueBuilderView
                initialValue={editingConstValue.value}
                onCancel={onCancelEditingConstValue}
                onSubmit={onFinishEditingConstValue}
                env={emptyObj}
                hideTemplatingTips={props.hideTemplatingTips}
              />
            ) : null}

            {inlineCodeTarget ? (
              <InlineCodeModal
                env={emptyObj}
                initialValue={
                  inlineCodeTarget.type === "existing" ? inlineCodeTarget.value : undefined
                }
                initialType={
                  inlineCodeTarget.type === "existing" ? inlineCodeTarget.codeType : undefined
                }
                onCancel={() => setInlineCodeTarget(undefined)}
                onSubmit={onSaveInlineCodePart}
              />
            ) : null} */}

            {omnibarVisible ? (
              <Omnibar
                flow={flow}
                repo={resolvedFlow.dependencies}
                onCommand={onOmnibarCmd}
                visible={omnibarVisible}
                onClose={hideOmnibar}
                onRequestImportables={props.onQueryImportables}
              />
            ) : null}

            {/* {editedDataBuilder ? (
              <ValueBuilderView
                initialValue={editedDataBuilder.src}
                onCancel={onCancelEditingDataBuilder}
                onSubmit={onFinishEditingDataBuilder}
                hideTemplatingTips={props.hideTemplatingTips}
                env={emptyObj}
              />
            ) : null} */}
          </React.Fragment>
        );
      }
    };

    return (
      <div className="project-editor">
        <PromptContextProvider showPrompt={promptHandler}>
          {renderInner()}
        </PromptContextProvider>
      </div>
    );
  })
);
