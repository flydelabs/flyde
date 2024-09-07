import {
  PinType,
  InputMode,
  NodeInstance,
  isStickyInputPinConfig,
  queueInputPinConfig,
  stickyInputPinConfig,
  THIS_INS_ID,
  isExternalConnectionNode,
  isInlineNodeInstance,
  isInternalConnectionNode,
  isVisualNode,
  NodeStyle,
  ImportableSource,
  isMacroNodeDefinition,
  isResolvedMacroNodeInstance,
  Pos,
  ConnectionData,
} from "@flyde/core";
import React from "react";
import {
  handleIoPinRename,
  handleChangeNodeInputType,
  getInstancePinConfig,
  changePinConfig,
  usePrompt,
  usePorts,
  getConnectionId,
  toastMsg,
  useConfirm,
  createNewMacroNodeInstance,
  createNewNodeInstance,
  vSub,
  useDependenciesContext,
  centerBoardPosOnTarget,
  Size,
  useHotkeys,
} from "..";
import { functionalChange } from "../flow-editor/flyde-flow-change-type";
import { useVisualNodeEditorContext } from "./VisualNodeEditorContext";
import produce from "immer";
import { handleDuplicateSelectedEditorCommand } from "./commands/duplicate-instances";

export function useEditorCommands(
  lastMousePos: React.MutableRefObject<Pos>,
  vpSize: Size,
  isBoardInFocus: React.MutableRefObject<boolean>,
  setEditedMacroInstance: React.Dispatch<
    React.SetStateAction<{ ins: NodeInstance } | undefined>
  >
) {
  const {
    node,
    onChangeNode: onChange,
    onChangeBoardData,
    boardData,
  } = useVisualNodeEditorContext();

  const { from, to, viewPort, selectedInstances, selectedConnections } =
    boardData;

  const _prompt = usePrompt();
  const _confirm = useConfirm();

  const { reportEvent } = usePorts();

  const { onImportNode } = useDependenciesContext();

  const onRenameIoPin = React.useCallback(
    async (type: PinType, pinId: string) => {
      const newName = (await _prompt("New name?", pinId)) || pinId;
      const newValue = handleIoPinRename(node, type, pinId, newName);
      onChange(newValue, functionalChange("rename io pin"));
    },
    [node, onChange, _prompt]
  );

  const onChangeInputMode = React.useCallback(
    (pinId: string, mode: InputMode) => {
      const newValue = handleChangeNodeInputType(node, pinId, mode);
      onChange(newValue, functionalChange("toggle io pin optional"));
    },
    [node, onChange]
  );

  const onToggleSticky = React.useCallback(
    (ins: NodeInstance, pinId: string, forceValue?: boolean) => {
      const currConfig = getInstancePinConfig(node, ins.id, pinId);
      const newConfig = isStickyInputPinConfig(currConfig)
        ? queueInputPinConfig()
        : stickyInputPinConfig();
      onChange(
        changePinConfig(node, ins.id, pinId, newConfig),
        functionalChange("toggle-sticky")
      );
      reportEvent("togglePinSticky", {
        isSticky: isStickyInputPinConfig(newConfig),
      });
    },

    [onChange, node, reportEvent]
  );

  const onRemoveIoPin = React.useCallback(
    (type: PinType, pinId: string) => {
      const newValue = produce(node, (draft) => {
        if (type === "input") {
          delete draft.inputs[pinId];
          draft.connections = draft.connections.filter(
            (conn) =>
              !(
                isExternalConnectionNode(conn.from) && conn.from.pinId === pinId
              )
          );
        } else {
          draft.connections = draft.connections.filter(
            (conn) =>
              !(isExternalConnectionNode(conn.to) && conn.to.pinId === pinId)
          );
          draft.completionOutputs = (draft.completionOutputs || [])
            .map((comp) => {
              const arr = comp.split("+"); // due to the r1+r1,r3 hack, see core tests
              return arr.filter((pin) => pin !== pinId).join("+");
            })
            .filter((i) => !!i);
          delete draft.outputs[pinId];
        }
      });

      if (from && from.insId === THIS_INS_ID && from.pinId === pinId) {
        onChangeBoardData({ from: undefined });
      } else if (to && to.insId === THIS_INS_ID && to.pinId === pinId) {
        onChangeBoardData({ to: undefined });
      }

      onChange(newValue, functionalChange("remove io pin"));
    },
    [node, from, to, onChange, onChangeBoardData]
  );

  const onDeleteInstances = React.useCallback(
    (ids: string[]) => {
      const newConnections = node.connections.filter(({ from, to }) => {
        return (
          !ids.includes(getConnectionId({ from, to })) &&
          !ids.includes(from.insId) &&
          !ids.includes(to.insId)
        );
      });

      const newValue = produce(node, (draft) => {
        draft.connections = newConnections;
        draft.instances = draft.instances.filter(
          (_ins) => !ids.includes(_ins.id)
        );
      });

      onChangeBoardData({ selectedInstances: [], selectedConnections: [] });
      onChange(newValue, functionalChange("delete-ins"));
    },
    [onChange, onChangeBoardData, node]
  );

  const onUnGroup = React.useCallback(
    (groupNodeIns: NodeInstance) => {
      if (isInlineNodeInstance(groupNodeIns)) {
        const visualNode = groupNodeIns.node;
        if (!isVisualNode(visualNode)) {
          toastMsg("Not supported", "warning");
          return;
        }

        const newNode = produce(node, (draft) => {
          draft.instances = draft.instances.filter(
            (ins) => ins.id !== groupNodeIns.id
          );

          draft.connections = draft.connections.filter(
            ({ from, to }) =>
              from.insId !== groupNodeIns.id && to.insId !== groupNodeIns.id
          );

          draft.instances.push(...visualNode.instances);
          draft.connections.push(
            ...visualNode.connections.filter((conn) => {
              return (
                isInternalConnectionNode(conn.from) &&
                isInternalConnectionNode(conn.to)
              );
            })
          );
        });

        onChange(newNode, { type: "functional", message: "ungroup" });
        // todo - combine the above with below to an atomic action
        onChangeBoardData({ selectedInstances: [] });
      } else {
        toastMsg("Cannot ungroup an imported group");
      }
    },
    [node, onChange, onChangeBoardData]
  );

  const onNodeIoSetDescription = React.useCallback(
    (type: PinType, pinId: string, description: string) => {
      const newNode = produce(node, (draft) => {
        if (type === "input") {
          draft.inputs[pinId].description = description;
        } else {
          draft.outputs[pinId].description = description;
        }
      });
      onChange(newNode, functionalChange("Node io description"));
    },
    [onChange, node]
  );

  const onChangeInstanceDisplayName = React.useCallback(
    (ins: NodeInstance, name: string) => {
      const newNode = produce(node, (draft) => {
        draft.instances = draft.instances.map((i) => {
          return i.id === ins.id ? { ...i, displayName: name } : i;
        });
      });
      onChange(newNode, functionalChange("change instance display name"));
    },
    [node, onChange]
  );

  const onChangeVisibleInputs = React.useCallback(
    (ins: NodeInstance, inputs: string[]) => {
      const newNode = produce(node, (draft) => {
        draft.instances = draft.instances.map((i) => {
          return i.id === ins.id ? { ...i, visibleInputs: inputs } : i;
        });
      });
      onChange(newNode, functionalChange("change instance visible inputs"));
    },
    [node, onChange]
  );

  const onChangeInstanceStyle = React.useCallback(
    (instance: NodeInstance, style: NodeStyle) => {
      const newNode = produce(node, (draft) => {
        draft.instances = draft.instances.map((ins) => {
          return ins.id === instance.id ? { ...ins, style } : ins;
        });
      });
      onChange(newNode, functionalChange("change instance style"));
      reportEvent("changeStyle", { isDefault: false });
    },
    [onChange, node, reportEvent]
  );

  const onChangeVisibleOutputs = React.useCallback(
    (ins: NodeInstance, outputs: string[]) => {
      const newNode = produce(node, (draft) => {
        draft.instances = draft.instances.map((i) => {
          return i.id === ins.id ? { ...i, visibleOutputs: outputs } : i;
        });
      });
      onChange(newNode, functionalChange("change instance visible outputs"));
    },
    [node, onChange]
  );

  const deleteSelection = React.useCallback(async () => {
    const { selectedConnections, selectedInstances, from, to } = boardData;
    const idsToDelete = [...selectedInstances, ...selectedConnections];
    if (idsToDelete.length === 0) {
      if (from && isExternalConnectionNode(from)) {
        if (
          await _confirm(
            `Are you sure you want to remove main input ${from.pinId}?`
          )
        ) {
          onRemoveIoPin("input", from.pinId);
        }
      } else if (to && isExternalConnectionNode(to)) {
        if (
          await _confirm(
            `Are you sure you want to remove main output ${to.pinId}?`
          )
        ) {
          onRemoveIoPin("output", to.pinId);
        }
      }
    } else {
      onDeleteInstances(idsToDelete);
    }
  }, [_confirm, boardData, onDeleteInstances, onRemoveIoPin]);

  const onAddNode = React.useCallback(
    async (importableNode: ImportableSource, position?: Pos) => {
      const depsWithImport = await onImportNode(importableNode);

      const targetPos =
        position ||
        vSub(lastMousePos.current, {
          x: 200,
          y: 50 * viewPort.zoom,
        });

      const newNodeIns = isMacroNodeDefinition(importableNode.node)
        ? createNewMacroNodeInstance(importableNode.node, 0, targetPos)
        : createNewNodeInstance(
            importableNode.node.id,
            0,
            targetPos,
            depsWithImport
          );
      const newNode = produce(node, (draft) => {
        draft.instances.push(newNodeIns);
      });

      const newState = produce(boardData, (draft) => {
        draft.selectedInstances = [newNodeIns.id];
      });

      onChange(newNode, functionalChange("add new instance"));

      onChangeBoardData(newState);

      if (isResolvedMacroNodeInstance(newNodeIns)) {
        // hack to allow imported macro to appear in deps. TODO: fix
        setTimeout(() => {
          setEditedMacroInstance({ ins: newNodeIns });
        }, 100);
      }
      reportEvent("addNode", {
        nodeId: importableNode.node.id,
        source: "actionMenu",
      });
    },
    [
      boardData,
      lastMousePos,
      node,
      onChange,
      onChangeBoardData,
      onImportNode,
      reportEvent,
      setEditedMacroInstance,
      viewPort.zoom,
    ]
  );

  const onSelectInstance = React.useCallback(
    ({ id }: NodeInstance, ev: React.MouseEvent) => {
      const newSelectedIfSelectionExists = ev.shiftKey
        ? selectedInstances.filter((sid) => sid !== id)
        : [];
      const newSelectedIfSelectionIsNew = ev.shiftKey
        ? [...selectedInstances, id]
        : [id];
      const newSelected = selectedInstances.includes(id)
        ? newSelectedIfSelectionExists
        : newSelectedIfSelectionIsNew;

      onChangeBoardData({
        selectedInstances: newSelected,
        selectedConnections: [],
        from: undefined,
        to: undefined,
      });
    },
    [onChangeBoardData, selectedInstances]
  );

  const selectAll = React.useCallback(() => {
    const allIds = node.instances.map((i) => i.id);
    onChangeBoardData({
      selectedInstances: allIds,
      selectedConnections: [],
      from: undefined,
      to: undefined,
    });
  }, [onChangeBoardData, node.instances]);

  const onDeleteInstance = React.useCallback(
    (ins: NodeInstance) => {
      onDeleteInstances([ins.id]);
    },
    [onDeleteInstances]
  );

  const duplicate = React.useCallback(() => {
    const { newNode, newInstances } = handleDuplicateSelectedEditorCommand(
      node,
      selectedInstances
    );

    onChange(newNode, functionalChange("duplicated instances"));
    onChangeBoardData({
      selectedInstances: newInstances.map((ins) => ins.id),
    });
    // onChange(duplicateSelected(value), functionalChange("duplicate"));
  }, [onChange, onChangeBoardData, node, selectedInstances]);

  const onSelectConnection = React.useCallback(
    (connection: ConnectionData, ev: React.MouseEvent) => {
      const connectionId = getConnectionId(connection);
      const newSelected = selectedConnections.includes(connectionId)
        ? selectedConnections.filter((id) => id !== connectionId)
        : [...(ev.shiftKey ? selectedConnections : []), connectionId];

      onChangeBoardData({
        selectedConnections: newSelected,
        selectedInstances: [],
      });
    },
    [onChangeBoardData, selectedConnections]
  );

  const onZoom = React.useCallback(
    (_newZoom: number, source?: "hotkey" | "mouse") => {
      const newZoom = Math.min(Math.max(_newZoom, 0.1), 3);
      const targetPos =
        source === "mouse"
          ? lastMousePos.current
          : {
              x: viewPort.pos.x + vpSize.width / 2,
              y: viewPort.pos.y + vpSize.height / 2,
            };
      const newPos = centerBoardPosOnTarget(
        targetPos,
        vpSize,
        newZoom,
        viewPort
      );

      onChangeBoardData({
        viewPort: { ...viewPort, zoom: newZoom, pos: newPos },
        // const newCenter = centerBoardPosOnTarget(lastMousePos.current, vpSize, newZoom, viewPort);
      });
    },
    [lastMousePos, onChangeBoardData, viewPort, vpSize]
  );

  const clearSelections = React.useCallback(() => {
    onChangeBoardData({
      from: undefined,
      to: undefined,
      selectedInstances: [],
      selectedConnections: [],
    });
  }, [onChangeBoardData]);

  useHotkeys(
    "cmd+=, ctrl+=",
    (e: any) => {
      onZoom(viewPort.zoom + 0.1, "hotkey");
      e.preventDefault();
    },
    { text: "Zoom in board", group: "Viewport Controls" },
    [viewPort, onZoom],
    isBoardInFocus
  );

  useHotkeys(
    "cmd+-, ctrl+-",
    (e) => {
      onZoom(viewPort.zoom - 0.1, "hotkey");
      e.preventDefault();
    },
    { text: "Zoom out board", group: "Viewport Controls" },
    [onZoom, viewPort.zoom],
    isBoardInFocus
  );

  useHotkeys(
    "cmd+0, ctrl+0",
    (e) => {
      onZoom(1);
      e.preventDefault();
    },
    { text: "Reset zoom", group: "Viewport Controls" },
    [viewPort, onZoom],
    isBoardInFocus
  );

  useHotkeys(
    "backspace",
    deleteSelection,
    { text: "Delete instances", group: "Editing" },
    [],
    isBoardInFocus
  );
  useHotkeys(
    "shift+d",
    duplicate,
    { text: "Duplicate selected instances", group: "Editing" },
    [],
    isBoardInFocus
  );
  useHotkeys(
    "cmd+a, ctrl+a",
    selectAll,
    { text: "Select all", group: "Selection" },
    [],
    isBoardInFocus
  );

  useHotkeys(
    "esc",
    clearSelections,
    { text: "Clear selections", group: "Selection" },
    [],
    isBoardInFocus
  );

  return {
    onRenameIoPin,
    onChangeInputMode,
    onToggleSticky,
    onRemoveIoPin,
    onDeleteInstances,
    onUnGroup,
    onNodeIoSetDescription,
    onChangeInstanceDisplayName,
    onChangeVisibleInputs,
    onChangeVisibleOutputs,
    onChangeInstanceStyle,
    deleteSelection,
    onAddNode,
    onSelectInstance,
    selectAll,
    onDeleteInstance,
    duplicate,
    onSelectConnection,
    onZoom,
    clearSelections,
  };
}
