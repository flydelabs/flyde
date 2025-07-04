import {
  PinType,
  InputMode,
  NodeInstance,
  isStickyInputPinConfig,
  queueInputPinConfig,
  stickyInputPinConfig,
  THIS_INS_ID,
  isInternalConnectionNode,
  isVisualNode,
  NodeStyle,
  Pos,
  ConnectionData,
  ConnectionNode,
  isInlineVisualNodeInstance,
  isExternalConnectionNode,
  ImportableEditorNode,
  EditorNodeInstance,
  EditorVisualNode,
  EditorCodeNodeDefinition,
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
  useConfirm,
  createNewNodeInstance,
  centerBoardPosOnTarget,
  Size,
  useHotkeys,
} from "..";
import { functionalChange } from "../flow-editor/flyde-flow-change-type";
import { useVisualNodeEditorContext } from "./VisualNodeEditorContext";
import produce from "immer";
import { handleDuplicateSelectedEditorCommand } from "./commands/duplicate-instances";
import { groupSelected } from "../group-selected";
import { handleConnectionCloseEditorCommand } from "./commands/close-connection";
import { useToast } from "../ui";

export function useEditorCommands(
  lastMousePos: React.MutableRefObject<Pos>,
  vpSize: Size,
  isBoardInFocus: React.MutableRefObject<boolean>
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

  const { toast } = useToast();

  const { reportEvent, resolveInstance } = usePorts();

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
    (groupNodeIns: EditorNodeInstance) => {
      if (isInlineVisualNodeInstance(groupNodeIns)) {
        const visualNode = groupNodeIns.source.data as EditorVisualNode;
        if (!isVisualNode(visualNode)) {
          toast({
            description: "Not supported",
            variant: "destructive",
          });
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
        toast({
          description: "Cannot ungroup an imported group",
          variant: "destructive",
        });
      }
    },
    [node, onChange, onChangeBoardData, toast]
  );

  const onNodeIoSetDescription = React.useCallback(
    (type: PinType, pinId: string, description: string) => {
      const newNode = produce(node, (draft) => {
        if (type === "input") {
          if (!draft.inputs[pinId]) {
            throw new Error("Pin does not exist");
          }
          draft.inputs[pinId].description = description;
        } else {
          if (!draft.outputs[pinId]) {
            throw new Error("Pin does not exist");
          }
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
    async (importableNode: ImportableEditorNode, position?: Pos) => {
      // Calculate the center of the viewport
      const targetPos = {
        x: viewPort.pos.x + vpSize.width / (2 * viewPort.zoom),
        y: viewPort.pos.y + vpSize.height / (2 * viewPort.zoom),
      };

      const newNodeIns = createNewNodeInstance(importableNode, 0, targetPos);
      const newNode = produce(node, (draft) => {
        draft.instances.push(newNodeIns);
      });

      const newState = produce(boardData, (draft) => {
        draft.selectedInstances = [newNodeIns.id];
      });

      onChange(newNode, functionalChange("add new instance"));

      onChangeBoardData(newState);

      reportEvent("addNode", {
        nodeId: importableNode.id,
        source: "actionMenu",
      });

      // ugly hack to resolve advanced configs lazyly - TODO - make this part of the "get library data" mechanism
      const maybeEditorConfig = (importableNode.editorNode as EditorCodeNodeDefinition).editorConfig;
      if (maybeEditorConfig && maybeEditorConfig.type === "custom") {
        resolveInstance({ instance: newNodeIns }).then((resolvedNode) => {
          const newNode = produce(node, (draft) => {
            draft.instances.push(resolvedNode);
          });
          onChange(newNode, functionalChange("add node - resolved"));
        });
      }
    },
    [boardData, node, onChange, onChangeBoardData, reportEvent, resolveInstance, viewPort.pos.x, viewPort.pos.y, viewPort.zoom, vpSize.height, vpSize.width]
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
    const { newNode, newInstancesIds } = handleDuplicateSelectedEditorCommand(
      node,
      selectedInstances
    );

    onChange(newNode, functionalChange("duplicated instances"));
    onChangeBoardData({
      selectedInstances: newInstancesIds,
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
      const newZoom = Math.min(Math.max(_newZoom, 0.3), 2);
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

  const onConnectionClose = React.useCallback(
    (from: ConnectionNode, to: ConnectionNode, source: string) => {
      // Prevent connection between main input and output
      if (from.insId === THIS_INS_ID && to.insId === THIS_INS_ID) {
        toast({
          description: "Cannot connect main input to main output",
          variant: "destructive",
        });
        return;
      }

      const newNode = handleConnectionCloseEditorCommand(node, {
        from,
        to,
      });

      onChange(newNode, functionalChange("close-connection"));
      onChangeBoardData({ from: undefined, to: undefined });
      reportEvent("createConnection", { source });
    },
    [onChange, onChangeBoardData, node, reportEvent, toast]
  );

  const onGroupSelectedInternal = React.useCallback(async () => {
    const name = await _prompt("New visual node name?");
    if (!name) return;
    const { currentNode } = await groupSelected(
      boardData.selectedInstances,
      node,
      name,
      _prompt
    );
    onChange(currentNode, functionalChange("group node"));

    onChangeBoardData({ selectedInstances: [] });

    toast({
      description: "Node grouped",
    });

    reportEvent("groupSelected", {
      count: boardData.selectedInstances.length,
    });
  }, [
    _prompt,
    boardData.selectedInstances,
    node,
    onChange,
    onChangeBoardData,
    reportEvent,
    toast,
  ]);

  const onNodeIoPinClick = React.useCallback(
    (pinId: string, type: PinType, event?: React.MouseEvent) => {
      const { to: currTo, from: currFrom, selectedInstances } = boardData;
      const ioId = `io_${type}_${pinId}`;

      // If shift key is pressed, toggle selection of this pin as part of a multi-select
      if (event?.shiftKey) {
        const newSelected = selectedInstances.includes(ioId)
          ? selectedInstances.filter(id => id !== ioId)
          : [...selectedInstances, ioId];

        onChangeBoardData({
          selectedInstances: newSelected,
          from: undefined,
          to: undefined
        });
        return;
      }

      const relevantCurrPin = type === "input" ? currFrom : currTo;
      const relevantTargetPin = type === "input" ? currTo : currFrom;

      const newPin = { pinId, insId: THIS_INS_ID };
      const targetObj = type === "input" ? { from: newPin } : { to: newPin };

      if (relevantCurrPin && relevantCurrPin.pinId === pinId) {
        // selecting the same pin so deselect both
        onChangeBoardData({ from: undefined, to: undefined });
      } else if (!relevantTargetPin) {
        // nothing was selected, selecting a new pin
        onChangeBoardData({
          ...targetObj,
          selectedInstances: [], // Clear selected instances when selecting a pin
        });
      } else {
        //close the connection if we have a target match
        if (type === "input" && currTo) {
          onConnectionClose(newPin, currTo, "nodeIoClick");
        } else if (currFrom) {
          onConnectionClose(currFrom, newPin, "nodeIoClick");
        }
      }
    },
    [boardData, onChangeBoardData, onConnectionClose]
  );

  const onPinClick = React.useCallback(
    (ins: NodeInstance, pinId: string, type: PinType) => {
      const { from: currFrom, to: currTo } = boardData;

      if ((from && from.insId === ins.id) || (to && to.insId === ins.id)) {
        // trying to connect the same instance to itself, so clear selection
        onChangeBoardData({ from: undefined, to: undefined });
      } else if (type === "input") {
        const to = { insId: ins.id, pinId };

        // is selecting same one
        if (
          currTo &&
          currTo.pinId === pinId &&
          (isInternalConnectionNode(currTo) ? currTo.insId === ins.id : true)
        ) {
          onChangeBoardData({ to: undefined });
        } else if (from) {
          onConnectionClose(from, to, "pinClick");
        } else {
          onChangeBoardData({
            to,
            selectedInstances: [],
            selectedConnections: [],
          });
        }
      } else {
        const from = { insId: ins.id, pinId };

        if (
          currFrom &&
          currFrom.pinId === pinId &&
          (isInternalConnectionNode(currFrom)
            ? currFrom.insId === ins.id
            : true)
        ) {
          onChangeBoardData({ from: undefined });
        } else if (to) {
          onConnectionClose(from, to, "pinClick");
        } else {
          onChangeBoardData({
            from,
            selectedInstances: [],
            selectedConnections: [],
          });
        }
      }
    },
    [boardData, from, onChangeBoardData, onConnectionClose, to]
  );

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
    "backspace, delete",
    deleteSelection,
    { text: "Delete instances", group: "Editing" },
    [],
    isBoardInFocus
  );
  useHotkeys(
    "cmd+d, ctrl+d",
    (e) => {
      e.preventDefault();
      duplicate();
    },
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
    onConnectionClose,
    onGroupSelectedInternal,
    onNodeIoPinClick,
    onPinClick,
  };
}
