import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  isInlineVisualNodeInstance,
  entries,
  pickFirst,
  OMap,
  keys,
  nodeInput,
  NodeStyle,
  getNodeOutputs,
  CodeNodeDefinition,
  VisualNodeInstance,
  CodeNodeInstance,
  EditorNodeInstance,
  isCodeNodeInstance,
  isCodeNode,
} from "@flyde/core";
import classNames from "classnames";
import { DiffStatus } from "../VisualNodeDiffView";

import { PinView } from "../pin-view/PinView";
import {
  ConnectionData,
  Pos,
  isStickyInputPinConfig,
  ERROR_PIN_ID,
  TRIGGER_PIN_ID,
  nodeOutput,
  isInputPinOptional,
} from "@flyde/core";
import { NodeInstance, PinType, getNodeInputs } from "@flyde/core";
import { calcNodeContent } from "./utils";
import { BaseNodeView } from "../base-node-view";

import { getInstanceDomId } from "../dom-ids";
import {
  ClosestPinData,
  VisualNodeEditor,
  VisualNodeEditorProps,
} from "../VisualNodeEditor";
import { usePrompt } from "../..";

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "../../ui";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui";

import { useDarkMode } from "../../flow-editor/DarkModeContext";
import {
  VisualNodeEditorContextType,
  VisualNodeEditorProvider,
} from "../VisualNodeEditorContext";
import { getInputName, getOutputName } from "../pin-view/helpers";

export const PIECE_HORIZONTAL_PADDING = 25;
export const PIECE_CHAR_WIDTH = 11;
export const MIN_WIDTH_PER_PIN = 40;
export const MAX_INSTANCE_WIDTH = 400; // to change in CSS as well

export const getVisibleInputs = (
  instance: NodeInstance,
  node: CodeNodeDefinition,
  connections: ConnectionData[]
): string[] => {
  const { visibleInputs } = instance;

  if (visibleInputs) {
    return visibleInputs;
  }

  const visiblePins = keys(getNodeInputs(node)).filter((k, v) => {
    const isConnected = connections.some(
      (c) => c.to.insId === instance.id && c.to.pinId === k
    );
    const isOptional = node.inputs[k] && node.inputs[k]?.mode === "optional";

    return isConnected || (!isOptional && k !== TRIGGER_PIN_ID);
  });

  if (visiblePins.length === 0 && !node.isTrigger) {
    return [TRIGGER_PIN_ID];
  }

  return visiblePins;
};

export const getVisibleOutputs = (
  instance: NodeInstance,
  node: CodeNodeDefinition,
  connections: ConnectionData[]
) => {
  const { visibleOutputs } = instance;

  if (visibleOutputs) {
    return visibleOutputs;
  }
  const keys = Object.keys(node.outputs);
  if (
    connections.some(
      (c) => c.from.insId === instance.id && c.from.pinId === ERROR_PIN_ID
    )
  ) {
    return [...keys, ERROR_PIN_ID];
  } else {
    return keys;
  }
};

export interface InstanceViewProps {
  instance: EditorNodeInstance;
  selected?: boolean;
  dragged?: boolean;
  selectedInput?: string;
  selectedOutput?: string;
  connectionsPerInput: OMap<NodeInstance[]>;
  closestPin?: ClosestPinData;
  connections: ConnectionData[];
  viewPort: { pos: Pos; zoom: number };
  diffStatus?: DiffStatus;

  queuedInputsData: Record<string, number>;

  ancestorsInsIds?: string;

  onPinClick: (v: NodeInstance, k: string, type: PinType) => void;
  onPinDblClick: (
    v: NodeInstance,
    k: string,
    type: PinType,
    e: React.MouseEvent
  ) => void;
  onDragEnd: (ins: EditorNodeInstance, ...data: any[]) => void;
  onDragStart: (ins: EditorNodeInstance, ...data: any[]) => void;
  onDragMove: (ins: EditorNodeInstance, ev: React.MouseEvent, pos: Pos) => void;
  onSelect: (ins: EditorNodeInstance, ev: React.MouseEvent) => void;
  onDblClick: (ins: EditorNodeInstance, shiftKey: boolean) => void;
  onToggleSticky: (ins: EditorNodeInstance, pinId: string) => void;
  onTogglePinLog: (insId: string, pinId: string, type: PinType) => void;
  onTogglePinBreakpoint: (insId: string, pinId: string, type: PinType) => void;

  onInspectPin: (insId: string, pin: { id: string; type: PinType }) => void;

  onUngroup: (ins: EditorNodeInstance) => void;

  onChangeVisibleInputs: (ins: EditorNodeInstance, inputs: string[]) => void;
  onChangeVisibleOutputs: (ins: EditorNodeInstance, outputs: string[]) => void;

  onDeleteInstance: (ins: EditorNodeInstance) => void;
  onSetDisplayName: (ins: EditorNodeInstance, displayName: string) => void;

  onViewForkCode: (ins: EditorNodeInstance) => void;

  displayMode?: true;

  forceShowMinimized?: PinType | "both";

  isConnectedInstanceSelected: boolean;

  increasedPinDropArea?: boolean;

  inlineGroupProps?: VisualNodeEditorProps & VisualNodeEditorContextType;
  onCloseInlineEditor: () => void;

  inlineEditorPortalDomNode: HTMLElement | null;

  onChangeStyle: (instance: EditorNodeInstance, style: NodeStyle) => void;
  onGroupSelected: () => void;

  onPinMouseDown: (ins: EditorNodeInstance, pinId: string, type: PinType) => void;
  onPinMouseUp: (ins: EditorNodeInstance, pinId: string, type: PinType) => void;

  hadError: boolean;
}

export const InstanceView: React.FC<InstanceViewProps> =
  function InstanceViewInner(props) {
    const {
      selected,
      selectedInput,
      selectedOutput,
      closestPin,
      dragged,
      onTogglePinLog,
      onTogglePinBreakpoint,
      displayMode,
      connections,
      instance,
      viewPort,
      onPinClick,
      onPinDblClick,
      onDragStart,
      onDragEnd,
      onDragMove,
      onToggleSticky,
      onSelect,
      onDblClick: onDoubleClick,
      onChangeVisibleInputs,
      onChangeVisibleOutputs,
      inlineGroupProps,
      onUngroup,
      onGroupSelected,
      isConnectedInstanceSelected,
      onDeleteInstance,
      onSetDisplayName,
      onPinMouseUp,
      onPinMouseDown,
      onViewForkCode,
    } = props;

    const dark = useDarkMode();

    const { id } = instance;

    const inlineEditorRef = React.useRef();

    const node = instance.node;

    const style = React.useMemo(() => {
      return {
        color: node?.defaultStyle?.color,
        size: node?.defaultStyle?.color ?? "regular",
        cssOverride: node?.defaultStyle?.cssOverride,
      } as NodeStyle;
    }, [node]);

    const connectedInputs = React.useMemo(() => {
      return new Map(
        connections
          .filter(({ to }) => to.insId === id)
          .map(({ to, hidden }) => [to.pinId, hidden])
      );
    }, [connections, id]);

    const connectedOutputs = React.useMemo(() => {
      return new Map(
        connections
          .filter(({ from }) => from.insId === id)
          .map(({ from, hidden }) => [from.pinId, hidden])
      );
    }, [connections, id]);

    const _prompt = usePrompt();

    const onInputClick = React.useCallback(
      (pin: string) => onPinClick(instance, pin, "input"),
      [instance, onPinClick]
    );

    const onInputDblClick = React.useCallback(
      (pin: string, e: any) => onPinDblClick(instance, pin, "input", e),
      [instance, onPinDblClick]
    );

    const onOutputDblClick = React.useCallback(
      (pin: string, e: any) => onPinDblClick(instance, pin, "output", e),
      [instance, onPinDblClick]
    );

    const onOutputClick = React.useCallback(
      (pin: string) => onPinClick(instance, pin, "output"),
      [instance, onPinClick]
    );

    const _onDragStart = React.useCallback(
      (event: any, data: any) => {
        onDragStart(instance, event, data);
      },
      [instance, onDragStart]
    );


    const _onSelect = React.useCallback(
      (e: any) => onSelect(instance, e),
      [instance, onSelect]
    );


    const _onDragEnd = React.useCallback(
      (event: any, data: any) => {
        const currPos = instance.pos;
        const dx = (data.x - currPos.x) / viewPort.zoom;
        const dy = (data.y - currPos.y) / viewPort.zoom;
        const newX = currPos.x + dx;
        const newY = currPos.y + dy;
        onDragEnd(instance, event, { ...data, x: newX, y: newY });
      },
      [instance, onDragEnd, viewPort.zoom]
    );

    const _onDragMove = React.useCallback(
      (event: any, data: any) => {
        onDragMove(instance, event, { x: data.x, y: data.y });
      },
      [instance, onDragMove]
    );

    const _onToggleSticky = React.useCallback(
      (pinId: string) => onToggleSticky(instance, pinId),
      [instance, onToggleSticky]
    );

    const onDblClick = React.useCallback(
      (e: React.MouseEvent) => onDoubleClick(instance, e.shiftKey),
      [instance, onDoubleClick]
    );



    const is = entries(node.inputs);

    const { visibleInputs, visibleOutputs } = instance;

    if (visibleInputs) {
      is.sort(
        (a, b) => visibleInputs.indexOf(a[0]) - visibleInputs.indexOf(b[0])
      );
    }

    const os = entries(node.outputs);

    if (visibleOutputs) {
      os.sort(
        (a, b) => visibleOutputs.indexOf(a[0]) - visibleOutputs.indexOf(b[0])
      );
    }

    const _visibleInputs = getVisibleInputs(instance, node, connections);

    const _visibleOutputs = getVisibleOutputs(instance, node, connections);

    is.push([
      TRIGGER_PIN_ID,
      {
        ...nodeInput(),
        description:
          "Controls when this node executes. When connected, node runs only when triggered. Otherwise, automatically runs when required inputs receive data or when flow starts if no inputs exist. Can be exposed via right-click menu",
      },
    ]);

    os.push([
      ERROR_PIN_ID,
      {
        ...nodeOutput(),
        description:
          "Use this pin to catch errors that happen inside this node. If not connected, errors will bubble up to the parent node.",
      },
    ]);

    const inputsToRender = is.filter(([k]) => {
      return (
        _visibleInputs.includes(k) ||
        ((selected || isConnectedInstanceSelected) && connectedInputs.has(k))
      );
    });

    const outputsToRender = os.filter(([k]) => {
      return (
        _visibleOutputs.includes(k) ||
        ((selected || isConnectedInstanceSelected) &&
          connectedOutputs.has(k)) ||
        (k === ERROR_PIN_ID && props.hadError)
      );
    });

    const isErrorCaught = connections.some(
      (conn) => conn.from.insId === id && conn.from.pinId === ERROR_PIN_ID
    );

    const cm = classNames("ins-view", {
      "no-inputs": inputsToRender.length === 0,
      "no-outputs": outputsToRender.length === 0,
      "display-mode": displayMode,
      "force-minimized-input":
        props.forceShowMinimized === "input" ||
        props.forceShowMinimized === "both",
      "force-minimized-output":
        props.forceShowMinimized === "output" ||
        props.forceShowMinimized === "both",
      "inline-node-edited": !!inlineGroupProps,
      "error-caught": isErrorCaught,
      selected,
      dragged,
      closest: closestPin && closestPin.ins.id === instance.id,
      "ring-2 ring-green-500/20 bg-green-50/10 dark:bg-green-950/10":
        props.diffStatus === "added",
      "ring-2 ring-red-500/20 bg-red-50/10 dark:bg-red-950/10":
        props.diffStatus === "removed",
      "ring-2 ring-blue-500/20 bg-blue-50/10 dark:bg-blue-950/10":
        props.diffStatus === "changed",
    });

    const optionalInputs = new Set(
      entries(node.inputs)
        .filter(([_, v]) => isInputPinOptional(v))
        .map(pickFirst)
    );

    const stickyInputs = entries(instance.inputConfig).reduce<{
      [k: string]: boolean;
    }>((p, [k, v]) => {
      if (isStickyInputPinConfig(v) || (v as any).sticky) {
        return { ...p, [k]: true };
      }
      return p;
    }, {});

    try {
      // customView =
      //   node.customView &&
      //   node.customView(instance, connectionsPerInput, connectionsPerOutput);
    } catch (e) {
      console.error(`Error rendering custom view for node ${node.id}`);
    }

    const content = React.useMemo(() => {
      const baseContent = calcNodeContent(instance, node);
      return props.diffStatus
        ? `${baseContent} (${props.diffStatus})`
        : baseContent;
    }, [instance, node, props.diffStatus]);

    const _onChangeVisibleInputs = React.useCallback(async () => {
      const inputs = keys(node.inputs);
      const res = await _prompt(
        "New order?",
        (instance.visibleInputs || inputs).join(",")
      );
      if (res) {
        onChangeVisibleInputs(instance, res.split(","));
      }
    }, [node.inputs, _prompt, instance, onChangeVisibleInputs]);

    const _onChangeVisibleOutputs = React.useCallback(async () => {
      const outputs = keys(node.outputs);
      const res = await _prompt(
        "New order?",
        (instance.visibleOutputs || outputs).join(",")
      );
      if (res) {
        onChangeVisibleOutputs(instance, res.split(","));
      }
    }, [node.outputs, _prompt, instance, onChangeVisibleOutputs]);

    const _onDeleteInstance = React.useCallback(() => {
      onDeleteInstance(instance);
    }, [onDeleteInstance, instance]);

    const _onSetDisplayName = React.useCallback(async () => {
      const name = await _prompt(
        `Set custom display name`,
        node.displayName || node.id
      );
      onSetDisplayName(instance, name ?? node.displayName ?? node.id);
    }, [_prompt, node.displayName, node.id, onSetDisplayName, instance]);

    const inputKeys = Object.keys(getNodeInputs(node));
    const outputKeys = Object.keys(getNodeOutputs(node));

    const _onPinMouseUp = React.useCallback(
      (pinId: string, pinType: PinType) => {
        if (onPinMouseUp) {
          onPinMouseUp(instance, pinId, pinType);
        }
      },
      [instance, onPinMouseUp]
    );

    const _onPinMouseDown = React.useCallback(
      (pinId: string, pinType: PinType) => {
        if (onPinMouseDown) {
          onPinMouseDown(instance, pinId, pinType);
        }
      },
      [instance, onPinMouseDown]
    );

    const onOptionsClick = React.useCallback(() => {
      if (isCodeNodeInstance(instance)) {
        onDoubleClick(instance, false);
      }
    }, [instance, onDoubleClick]);

    const getContextMenu = React.useCallback(() => {
      const inputMenuItems = inputKeys
        .filter(k => k !== TRIGGER_PIN_ID)
        .map((k) => {
          const isVisible = _visibleInputs.includes(k);
          const isConnectedAndNotHidden =
            connectedInputs.has(k) && connectedInputs.get(k) !== true;

          const pinName = getInputName(k);

          return (
            <ContextMenuItem
              key={k}
              disabled={isConnectedAndNotHidden && isVisible}
              onClick={() =>
                onChangeVisibleInputs(
                  instance,
                  isVisible
                    ? _visibleInputs.filter((i) => i !== k)
                    : [..._visibleInputs, k]
                )
              }
            >
              {isVisible
                ? isConnectedAndNotHidden
                  ? `Hide "${pinName}" (disconnect first)`
                  : `Hide "${pinName}"`
                : `Show "${pinName}"`}
            </ContextMenuItem>
          );
        });



      const outputMenuItems = outputKeys.map((k) => {
        const isVisible = _visibleOutputs.includes(k);
        const isConnected = connectedOutputs.has(k);

        const pinName = getOutputName(k);

        return (
          <ContextMenuItem
            key={k}
            disabled={isConnected && isVisible}
            onClick={() =>
              onChangeVisibleOutputs(
                instance,
                isVisible
                  ? _visibleOutputs.filter((i) => i !== k)
                  : [..._visibleOutputs, k]
              )
            }
          >
            {isVisible
              ? isConnected
                ? `Hide output "${pinName}" (disconnect first)`
                : `Hide "${pinName}"`
              : `Show "${pinName}"`}
          </ContextMenuItem>
        );
      });

      // Check if trigger pin is visible
      const isTriggerVisible = _visibleInputs.includes(TRIGGER_PIN_ID);
      const triggerMenuItem = (
        <ContextMenuItem
          key="trigger"
          onClick={() =>
            onChangeVisibleInputs(
              instance,
              isTriggerVisible
                ? _visibleInputs.filter((i) => i !== TRIGGER_PIN_ID)
                : [..._visibleInputs, TRIGGER_PIN_ID]
            )
          }
        >
          {isTriggerVisible ? "Hide trigger input" : "Show trigger input"}
        </ContextMenuItem>
      );

      const isTrigger = isCodeNode(node) && node.isTrigger;

      return (
        <ContextMenuContent>
          <ContextMenuItem onClick={_onSetDisplayName}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={onOptionsClick}>
            Options
          </ContextMenuItem>
          {isTrigger ? null : <ContextMenuItem onClick={() => onViewForkCode(instance)}>
            View/fork code
          </ContextMenuItem>}

          {isTrigger ? null : (<ContextMenuSub>
            <ContextMenuSubTrigger>Edit inputs</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={_onChangeVisibleInputs}>
                Reorder inputs
              </ContextMenuItem>
              {inputMenuItems}
              {triggerMenuItem}
            </ContextMenuSubContent>
          </ContextMenuSub>)}

          <ContextMenuSub>
            <ContextMenuSubTrigger>Edit outputs</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={_onChangeVisibleOutputs}>
                Reorder outputs
              </ContextMenuItem>
              {outputMenuItems}
            </ContextMenuSubContent>
          </ContextMenuSub>

          {isInlineVisualNodeInstance(instance) && (
            <ContextMenuItem onClick={() => onUngroup(instance)}>
              Ungroup inline node
            </ContextMenuItem>
          )}

          <ContextMenuItem onClick={onGroupSelected}>
            Group selected instances
          </ContextMenuItem>
          <ContextMenuItem className="text-red-500" onClick={_onDeleteInstance}>
            Delete instance
          </ContextMenuItem>
        </ContextMenuContent>
      );
    }, [inputKeys, outputKeys, _visibleInputs, node, _onSetDisplayName, onOptionsClick, _onChangeVisibleInputs, _onChangeVisibleOutputs, instance, onGroupSelected, _onDeleteInstance, connectedInputs, onChangeVisibleInputs, _visibleOutputs, connectedOutputs, onChangeVisibleOutputs, onUngroup, onViewForkCode]);

    const instanceDomId = getInstanceDomId(instance.id, props.ancestorsInsIds);

    const maybeRenderInlineGroupEditor = () => {
      if (inlineGroupProps) {
        return (
          <Dialog open={true} onOpenChange={() => props.onCloseInlineEditor()}>
            <DialogContent className="inline-group-editor-container no-drag w-[85vw] max-w-[95vw] h-[85vh] max-h-[95vh] flex flex-col overflow-hidden p-0">
              <DialogHeader className="border-b py-3 px-6">
                <DialogTitle className="font-medium">{`Editing inline node ${content}`}</DialogTitle>
              </DialogHeader>

              <div className="flex-1 flex overflow-auto" tabIndex={0}>
                <VisualNodeEditorProvider
                  boardData={inlineGroupProps.boardData}
                  onChangeBoardData={inlineGroupProps.onChangeBoardData}
                  node={inlineGroupProps.node}
                  onChangeNode={inlineGroupProps.onChangeNode}
                >
                  <VisualNodeEditor
                    {...props.inlineGroupProps as any}
                    className="no-drag flex-1 w-full h-full"
                    ref={inlineEditorRef}
                  />
                </VisualNodeEditorProvider>
              </div>
            </DialogContent>
          </Dialog>
        );
      } else {
        return null;
      }
    };

    const nodeIdForDomDataAttr = (
      instance as VisualNodeInstance | CodeNodeInstance
    ).nodeId;

    const nodeSize = React.useMemo(() => {
      const hasLongDisplayName = content?.length > 20;
      const longestInput = Math.max(...inputsToRender.map(([k]) => k.length));
      const longestOutput = Math.max(...outputsToRender.map(([k]) => k.length));
      const hasLongPin = longestInput > 7 || longestOutput > 7;
      return hasLongDisplayName || hasLongPin ? "wide" : "normal";
    }, [content, inputsToRender, outputsToRender]);

    const renderInputs = () => {
      if (!inputsToRender.length) {
        return null;
      }
      return (
        <div className="inputs">
          {inputsToRender.map(([k, v]) => (
            <div className="pin-container inputs" key={k}>
              <PinView
                type="input"
                currentInsId={instance.id}
                ancestorsInsIds={props.ancestorsInsIds}
                id={k}
                optional={optionalInputs.has(k)}
                connected={connectedInputs.has(k)}
                isSticky={stickyInputs[k] ?? false}
                increasedDropArea={props.increasedPinDropArea}
                // minimized={!selected}
                onToggleSticky={_onToggleSticky}
                selected={k === selectedInput}
                onClick={onInputClick}
                onDoubleClick={onInputDblClick}
                isClosestToMouse={
                  !!closestPin &&
                  closestPin.type === "input" &&
                  closestPin.pin === k
                }
                onToggleLogged={onTogglePinLog}
                onToggleBreakpoint={onTogglePinBreakpoint}
                onInspect={props.onInspectPin}
                description={v.description}
                queuedValues={props.queuedInputsData[k] ?? 0}
                onMouseUp={_onPinMouseUp}
                onMouseDown={_onPinMouseDown}
                isMain={false}
              />
            </div>
          ))}
        </div>
      );
    };

    const renderOutputs = () => {
      if (!outputsToRender.length) {
        return null;
      }
      return (
        <div className="outputs">
          {outputsToRender.map(([k, v]) => (
            <div className="pin-container outputs" key={k}>
              <PinView
                currentInsId={instance.id}
                ancestorsInsIds={props.ancestorsInsIds}
                connected={connectedOutputs.has(k)}
                increasedDropArea={props.increasedPinDropArea}
                type="output"
                id={k}
                // minimized={selected ? false : outputsToRender.length === 1}
                isClosestToMouse={
                  !!closestPin &&
                  closestPin.type === "output" &&
                  closestPin.pin === k
                }
                selected={k === selectedOutput}
                onClick={onOutputClick}
                onDoubleClick={onOutputDblClick}
                onToggleLogged={onTogglePinLog}
                onToggleBreakpoint={onTogglePinBreakpoint}
                onInspect={props.onInspectPin}
                description={v.description}
                onMouseUp={_onPinMouseUp}
                onMouseDown={_onPinMouseDown}
                isMain={false}
              />
            </div>
          ))}
        </div>
      );
    };

    if (!node) {
      return "LOADING";
    }

    return (
      <div
        className={cm}
        data-node-id={nodeIdForDomDataAttr}
        data-instance-id={instance.id}
      >
        <BaseNodeView
          pos={instance.pos}
          viewPort={viewPort}
          onDragStart={_onDragStart}
          onDragMove={_onDragMove}
          onDragEnd={_onDragEnd}
          displayMode={displayMode}
          domId={instanceDomId}
          heading={content}
          description={node.description}
          icon={node.icon}
          leftSide={renderInputs()}
          rightSide={renderOutputs()}
          selected={selected}
          dark={dark}
          contextMenuContent={getContextMenu()}
          onClick={_onSelect}
          overrideNodeBodyHtml={node.overrideNodeBodyHtml}
          overrideStyle={style.cssOverride}
          onDoubleClick={onDblClick}
          size={nodeSize}
          diffStatus={props.diffStatus}
        />
        {maybeRenderInlineGroupEditor()}
      </div>
    );
  };

export const InstanceIcon: React.FC<{ icon?: string; className?: string }> =
  function InstanceIcon({ icon, className }) {
    if (!icon) {
      return <FontAwesomeIcon icon="code" size="lg" />;
    }
    if (typeof icon === "string" && icon.trim().startsWith("<")) {
      return (
        <span
          className={classNames("svg-icon-container", className)}
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      );
    } else {
      return (
        <FontAwesomeIcon icon={icon as any} size="lg" className={className} />
      );
    }
  };
