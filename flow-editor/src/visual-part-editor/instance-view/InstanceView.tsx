import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  entries,
  pickFirst,
  OMap,
  okeys,
  partInput,
  keys,
  isInlinePartInstance,
  InlinePartInstance,
  randomInt,
  pickRandom,
  PartStyle,
  getPartOutputs,
  getInputName,
  getOutputName,
} from "@flyde/core";
import classNames from "classnames";

import { PinView } from "../pin-view/PinView";
import {
  ConnectionData,
  Pos,
  PartDefRepo,
  isStickyInputPinConfig,
  ERROR_PIN_ID,
  TRIGGER_PIN_ID,
  partOutput,
  isInputPinOptional,
} from "@flyde/core";
import {
  PartInstance,
  isVisualPart,
  PartDefinition,
  PinType,
  getPartInputs,
} from "@flyde/core";
import { calcPartContent } from "./utils";
import { BasePartView } from "../base-part-view";
import { isStaticInputPinConfig } from "@flyde/core";

import { getInstanceDomId } from "../dom-ids";
import { HistoryPayload } from "@flyde/remote-debugger";
import {
  ClosestPinData,
  VisualPartEditor,
  VisualPartEditorProps,
} from "../VisualPartEditor";
import { usePrompt } from "../..";
import { ContextMenu, IMenuItemProps, Menu, MenuItem } from "@blueprintjs/core";
import ReactDOM from "react-dom";
import { PartStyleMenu } from "./PartStyleMenu";
import CustomReactTooltip from "../../lib/tooltip";

export const PIECE_HORIZONTAL_PADDING = 25;
export const PIECE_CHAR_WIDTH = 11;
export const MIN_WIDTH_PER_PIN = 40;
export const MAX_INSTANCE_WIDTH = 400; // to change in CSS as well
export const INSTANCE_INFO_TOOLTIP_DELAY = 400;

export const getVisibleInputs = (
  instance: PartInstance,
  part: PartDefinition,
  connections: ConnectionData[]
): string[] => {
  const { visibleInputs } = instance;

  if (visibleInputs) {
    return visibleInputs;
  }

  const visiblePins = keys(getPartInputs(part)).filter((k, v) => {
    const isConnected = connections.some(
      (c) => c.to.insId === instance.id && c.to.pinId === k
    );
    // const isStatic = isStaticInputPinConfig(instance.inputConfig[k]);

    // const isRequired = part.inputs[k] && part.inputs[k]?.mode === "required";

    const isOptional = part.inputs[k] && part.inputs[k]?.mode === "optional";

    return isConnected || (!isOptional && k !== TRIGGER_PIN_ID);
  });

  if (visiblePins.length === 0) {
    return [TRIGGER_PIN_ID];
  }

  return visiblePins;
};

export const getVisibleOutputs = (
  instance: PartInstance,
  part: PartDefinition,
  connections: ConnectionData[]
) => {
  const { visibleOutputs } = instance;

  if (visibleOutputs) {
    return visibleOutputs;
  }
  const keys = Object.keys(part.outputs);
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
  instance: PartInstance;
  part: PartDefinition;
  selected?: boolean;
  dragged?: boolean;
  selectedInput?: string;
  selectedOutput?: string;
  connectionsPerInput: OMap<PartInstance[]>;
  connectionsPerOutput: OMap<PartInstance[]>;
  closestPin?: ClosestPinData;
  connections: ConnectionData[];
  viewPort: { pos: Pos; zoom: number };

  parentInsId: string;

  partDefRepo: PartDefRepo;
  onPinClick: (v: PartInstance, k: string, type: PinType) => void;
  onPinDblClick: (
    v: PartInstance,
    k: string,
    type: PinType,
    e: React.MouseEvent
  ) => void;
  onDragEnd: (ins: PartInstance, ...data: any[]) => void;
  onDragStart: (ins: PartInstance, ...data: any[]) => void;
  onDragMove: (ins: PartInstance, ev: React.MouseEvent, pos: Pos) => void;
  onSelect: (ins: PartInstance, ev: React.MouseEvent) => void;
  onDblClick: (ins: PartInstance, shiftKey: boolean) => void;
  onToggleSticky: (ins: PartInstance, pinId: string) => void;
  onTogglePinLog: (insId: string, pinId: string, type: PinType) => void;
  onTogglePinBreakpoint: (insId: string, pinId: string, type: PinType) => void;

  onInspectPin: (insId: string, pinId: string, type: PinType) => void;

  onUngroup: (ins: PartInstance) => void;
  onDetachConstValue: (ins: PartInstance, pinId: string) => void;
  onCopyConstValue: (ins: PartInstance, pinId: string) => void;
  onPasteConstValue: (ins: PartInstance, pinId: string) => void;
  onConvertConstToEnv?: (ins: PartInstance, pinId: string) => void;

  onRequestHistory: (
    insId: string,
    pinId: string,
    type: PinType
  ) => Promise<HistoryPayload>;

  onChangeVisibleInputs: (ins: PartInstance, inputs: string[]) => void;
  onChangeVisibleOutputs: (ins: PartInstance, outputs: string[]) => void;

  onDeleteInstance: (ins: PartInstance) => void;
  onSetDisplayName: (ins: PartInstance, view: string | undefined) => void;

  copiedConstValue?: any;

  displayMode?: true;

  forceShowMinimized?: PinType | "both";

  isConnectedInstanceSelected: boolean;

  inlineGroupProps?: VisualPartEditorProps;
  onCloseInlineEditor: () => void;

  onExtractInlinePart: (instance: InlinePartInstance) => Promise<void>;

  inlineEditorPortalDomNode: HTMLElement;

  onChangeStyle: (instance: PartInstance, style: PartStyle) => void;
  onGroupSelected: () => void;
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
      onDetachConstValue,
      onCopyConstValue,
      onPasteConstValue,
      displayMode,
      connections,
      instance,
      viewPort,
      part,
      onPinClick,
      onPinDblClick,
      onDragStart,
      onRequestHistory,
      onDragEnd,
      onDragMove,
      onToggleSticky,
      onSelect,
      onDblClick: onDoubleClick,
      onChangeVisibleInputs,
      onChangeVisibleOutputs,
      onConvertConstToEnv,
      inlineGroupProps,
      onUngroup,
      onExtractInlinePart,
      onGroupSelected,
      isConnectedInstanceSelected,
      inlineEditorPortalDomNode,
      onChangeStyle,
      onDeleteInstance,
      onSetDisplayName,
    } = props;

    const { id } = instance;

    const theme = React.useMemo(() => {
      const icons = [["fab", "discord"], ["fab", "slack"], "bug", "cube"];
      const color = randomInt(6, 1);
      const icon = pickRandom(icons);
      const size = randomInt(3, 1);

      return { icon, color, size, variation: randomInt(5, 1) };
    }, []);

    const inlineEditorRef = React.useRef();

    const style = React.useMemo(
      () => instance.style || part.defaultStyle || {},
      [part, instance]
    );

    const size = style.size || "regular";

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
      (pin: string, e) => onPinDblClick(instance, pin, "input", e),
      [instance, onPinDblClick]
    );

    const onOutputDblClick = React.useCallback(
      (pin: string, e) => onPinDblClick(instance, pin, "output", e),
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

    const _onDetachConstValue = React.useCallback(
      (pinId: string) => onDetachConstValue(instance, pinId),
      [instance, onDetachConstValue]
    );

    const _onCopyConstValue = React.useCallback(
      (pinId: string) => onCopyConstValue(instance, pinId),
      [instance, onCopyConstValue]
    );

    const _onPasteConstValue = React.useCallback(
      (pinId: string) => onPasteConstValue(instance, pinId),
      [instance, onPasteConstValue]
    );

    const _onSelect = React.useCallback(
      (e: any) => onSelect(instance, e),
      [instance, onSelect]
    );

    const onDblClick = React.useCallback(
      (e: React.MouseEvent) => onDoubleClick(instance, e.shiftKey),
      [instance, onDoubleClick]
    );

    const is = entries(part.inputs);

    const { visibleInputs, visibleOutputs } = instance;

    if (visibleInputs) {
      is.sort(
        (a, b) => visibleInputs.indexOf(a[0]) - visibleInputs.indexOf(b[0])
      );
    }

    const os = entries(part.outputs);

    if (visibleOutputs) {
      os.sort(
        (a, b) => visibleOutputs.indexOf(a[0]) - visibleOutputs.indexOf(b[0])
      );
    }

    const _visibleInputs = getVisibleInputs(instance, part, connections);

    const _visibleOutputs = getVisibleOutputs(instance, part, connections);

    is.push([TRIGGER_PIN_ID, partInput()]);

    os.push([ERROR_PIN_ID, partOutput()]);

    const inputsToRender = is.filter(([k]) => {
      return (
        _visibleInputs.includes(k) ||
        ((selected || isConnectedInstanceSelected) && connectedInputs.has(k))
      );
    });

    const outputsToRender = os.filter(([k]) => {
      return (
        _visibleOutputs.includes(k) ||
        ((selected || isConnectedInstanceSelected) && connectedOutputs.has(k))
      );
    });

    const cm = classNames("ins-view", {
      "no-inputs": is.length === 0,
      "no-outputs": os.length === 0,
      "display-mode": displayMode,
      "force-minimized-input":
        props.forceShowMinimized === "input" ||
        props.forceShowMinimized === "both",
      "force-minimized-output":
        props.forceShowMinimized === "output" ||
        props.forceShowMinimized === "both",
      "inline-part-edited": !!inlineGroupProps,
    });

    const innerCms = classNames(
      {
        selected,
        dragged,
        closest: closestPin && closestPin.ins.id === instance.id,
      },
      `size-${size}`
    );

    const optionalInputs = new Set(
      entries(part.inputs)
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
      //   part.customView &&
      //   part.customView(instance, connectionsPerInput, connectionsPerOutput, partDefRepo);
    } catch (e) {
      console.error(`Error rendering custom view for part ${part.id}`);
    }

    const content = calcPartContent(instance, part);

    const getStaticValue = (k: string) => {
      const config = instance.inputConfig[k];
      if (isStaticInputPinConfig(config)) {
        return config.value;
      }
    };

    const _onChangeVisibleInputs = React.useCallback(async () => {
      const inputs = okeys(part.inputs);
      const res = await _prompt(
        "New order?",
        (instance.visibleInputs || inputs).join(",")
      );
      if (res) {
        onChangeVisibleInputs(instance, res.split(","));
      }
    }, [part.inputs, _prompt, instance, onChangeVisibleInputs]);

    const _onChangeVisibleOutputs = React.useCallback(async () => {
      const outputs = okeys(part.outputs);
      const res = await _prompt(
        "New order?",
        (instance.visibleOutputs || outputs).join(",")
      );
      if (res) {
        onChangeVisibleOutputs(instance, res.split(","));
      }
    }, [part.outputs, _prompt, instance, onChangeVisibleOutputs]);

    const _onDeleteInstance = React.useCallback(() => {
      onDeleteInstance(instance);
    }, [onDeleteInstance, instance]);

    const _onSetDisplayName = React.useCallback(async () => {
      const name = await _prompt(
        `Set custom display name`,
        instance.displayName || part.id
      );
      onSetDisplayName(instance, name);
    }, [_prompt, instance, onSetDisplayName, part.id]);

    const inputKeys = Object.keys(getPartInputs(part));
    const outputKeys = Object.keys(getPartOutputs(part));

    const _onRequestHistory = React.useCallback(
      (pinId: string, pinType: PinType) => {
        return onRequestHistory(instance.id, pinId, pinType);
      },
      [instance, onRequestHistory]
    );

    const _onConvertConstToEnv = React.useCallback(
      (pinId: string) => {
        if (onConvertConstToEnv) {
          onConvertConstToEnv(instance, pinId);
        }
      },
      [instance, onConvertConstToEnv]
    );

    const renderInputs = () => {
      return (
        <div className="inputs no-drag">
          {inputsToRender.map(([k, v]) => (
            <PinView
              type="input"
              insId={instance.id}
              parentInsId={props.parentInsId}
              id={k}
              key={k}
              optional={optionalInputs.has(k)}
              connected={connectedInputs.has(k)}
              isSticky={stickyInputs[k]}
              minimized={selected ? false : inputsToRender.length === 1}
              onToggleSticky={_onToggleSticky}
              onDetachConstValue={_onDetachConstValue}
              onCopyConstValue={_onCopyConstValue}
              onPasteConstValue={_onPasteConstValue}
              copiedConstValue={props.copiedConstValue}
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
              constValue={getStaticValue(k)}
              // constValue={constInputs && constInputs.get(k) && (constInputs.get(k) as any).val}
              onRequestHistory={_onRequestHistory}
              onConvertConstToEnv={
                props.onConvertConstToEnv ? _onConvertConstToEnv : undefined
              }
              description={v.description}
            />
          ))}
        </div>
      );
    };

    const renderOutputs = () => {
      return (
        <div className="outputs no-drag">
          {outputsToRender.map(([k, v]) => (
            <PinView
              insId={instance.id}
              parentInsId={props.parentInsId}
              connected={connectedOutputs.has(k)}
              key={k}
              type="output"
              id={k}
              minimized={selected ? false : outputsToRender.length === 1}
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
              onRequestHistory={_onRequestHistory}
              description={v.description}
            />
          ))}
        </div>
      );
    };

    const _onChangeStyle = React.useCallback(
      (style: PartStyle) => {
        onChangeStyle(instance, style);
      },
      [instance, onChangeStyle]
    );

    const getContextMenu = React.useCallback(() => {
      const inputMenuItems = inputKeys.map((k) => {
        const isVisible = _visibleInputs.includes(k);
        const isConnectedAndNotHidden =
          connectedInputs.has(k) && connectedInputs.get(k) !== true;

        const pinName = getInputName(k);

        return {
          text: isVisible
            ? isConnectedAndNotHidden
              ? `Hide input "${pinName}" (disconnect first)`
              : `Hide input "${pinName}"`
            : `Show input "${pinName}"`,
          onClick: () =>
            onChangeVisibleInputs(
              instance,
              isVisible
                ? _visibleInputs.filter((i) => i !== k)
                : [..._visibleInputs, k]
            ),
          disabled: isConnectedAndNotHidden && isVisible,
        };
      });

      const outputMenuItems = outputKeys.map((k) => {
        const isVisible = _visibleOutputs.includes(k);
        const isConnected = connectedOutputs.has(k);

        const pinName = getOutputName(k);

        return {
          text: isVisible
            ? isConnected
              ? `Hide output "${pinName}" (disconnect first)`
              : `Hide output "${pinName}"`
            : `Show output "${pinName}"`,
          onClick: () =>
            onChangeVisibleOutputs(
              instance,
              isVisible
                ? _visibleOutputs.filter((i) => i !== k)
                : [..._visibleOutputs, k]
            ),
          disabled: isConnected && isVisible,
        };
      });

      const contextMenuItems: IMenuItemProps[] = [
        ...inputMenuItems,
        ...outputMenuItems,
        ...(isInlinePartInstance(instance) && isVisualPart(instance.part)
          ? [
              {
                text: "Ungroup inline part",
                onClick: () => onUngroup(instance),
              },
            ]
          : []),
        ...(isInlinePartInstance(instance)
          ? [
              {
                text: "Extract inline part to file",
                onClick: () => onExtractInlinePart(instance),
              },
            ]
          : []),
        { text: "Reorder inputs", onClick: _onChangeVisibleInputs },
        { text: "Reorder outputs", onClick: _onChangeVisibleOutputs },
        { text: `Set display name`, onClick: _onSetDisplayName },
        { text: "Group selected instances", onClick: onGroupSelected },
        {
          text: "Delete instance",
          intent: "danger",
          onClick: _onDeleteInstance,
        },
      ];
      return (
        <Menu>
          <MenuItem text="Style">
            <PartStyleMenu
              style={style}
              onChange={_onChangeStyle}
              promptFn={_prompt}
            />
          </MenuItem>
          {contextMenuItems.map((item) => (
            <MenuItem {...item} />
          ))}
        </Menu>
      );
    }, [
      inputKeys,
      outputKeys,
      instance,
      _onChangeVisibleInputs,
      _onChangeVisibleOutputs,
      _onSetDisplayName,
      _onDeleteInstance,
      style,
      _onChangeStyle,
      _prompt,
      _visibleInputs,
      connectedInputs,
      onChangeVisibleInputs,
      _visibleOutputs,
      connectedOutputs,
      onChangeVisibleOutputs,
      onUngroup,
      onExtractInlinePart,
      onGroupSelected,
    ]);

    const showMenu = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const menu = getContextMenu();
        ContextMenu.show(menu, { left: e.clientX, top: e.clientY });
      },
      [getContextMenu]
    );

    const styleVarProp = {
      "--part-color": style.color,
      ...(style.cssOverride || {}),
    } as React.CSSProperties;

    const instanceDomId = getInstanceDomId(props.parentInsId, instance.id);

    const renderContent = () => {
      if (inlineGroupProps) {
        return (
          // ReactDOM.createPortal((<Resizable width={inlineEditorSize.w} height={inlineEditorSize.h} onResize={onResizeInline} handle={<span className='no-drag react-resizable-handle react-resizable-handle-se'/>}>
          ReactDOM.createPortal(
            <div
              className="inline-group-editor-container no-drag"
              // style={{ width: `${inlineEditorSize.w}px`, height: `${inlineEditorSize.h}px` }}
            >
              <header>
                {content}{" "}
                <button onClick={props.onCloseInlineEditor}>close</button>
              </header>
              <VisualPartEditor
                {...props.inlineGroupProps}
                className="no-drag"
                ref={inlineEditorRef}
              />
            </div>,
            inlineEditorPortalDomNode
          )
          // </Resizable>), inlineEditorPortalDomNode)
        );
      } else {
        return (
          <div
            className={classNames(
              "ins-view-inner",
              innerCms,
              `size-${theme.size}`
            )}
            onClick={_onSelect}
            onDoubleClick={onDblClick}
            onContextMenu={showMenu}
            style={styleVarProp}
            data-tip={part.description}
            data-for={instanceDomId + "__tooltip"}
          >
            {style.icon ? <FontAwesomeIcon icon={style.icon as any} /> : null}{" "}
            {content}
          </div>
        );
      }
    };

    return (
      <div className={cm}>
        <BasePartView
          pos={instance.pos}
          viewPort={viewPort}
          onDragStart={_onDragStart}
          onDragMove={_onDragMove}
          onDragEnd={_onDragEnd}
          upperRenderer={renderInputs}
          bottomRenderer={renderOutputs}
          displayMode={displayMode}
          domId={instanceDomId}
        >
          <CustomReactTooltip
            className="instance-info-tooltip"
            html
            id={instanceDomId + "__tooltip"}
            delayShow={INSTANCE_INFO_TOOLTIP_DELAY}
          />
          {renderInputs()}
          {renderContent()}
          {renderOutputs()}
        </BasePartView>
      </div>
    );
  };
