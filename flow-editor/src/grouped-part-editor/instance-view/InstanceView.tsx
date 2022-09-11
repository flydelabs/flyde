import * as React from "react";
import { entries, pickFirst, OMap, okeys, partInput, keys, isInlinePartInstance } from "@flyde/core";
import classNames from "classnames";

// ;
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
import { PartInstance, isGroupedPart, PartDefinition, isNativePart, PinType } from "@flyde/core";
import { calcPartContent } from "./utils";
import { BasePartView } from "../base-part-view";
import { isStaticInputPinConfig } from "@flyde/core";

import { noop } from "lodash";
import { getInstanceDomId } from "../dom-ids";
import { HistoryPayload } from "@flyde/remote-debugger";
import { toastMsg } from "../../toaster";
import { ClosestPinData } from "../GroupedPartEditor";
import { usePrompt } from "../../lib/react-utils/prompt";

export const PIECE_HORIZONTAL_PADDING = 25;
export const PIECE_CHAR_WIDTH = 11;
export const MIN_WIDTH_PER_PIN = 40;
export const MAX_INSTANCE_WIDTH = 400; // to change in CSS as well

export const getDefaultVisibleInputs = (
  instance: PartInstance,
  part: PartDefinition,
  connections: ConnectionData[]
) => {
  const visiblePins = [...keys(part.inputs), TRIGGER_PIN_ID].filter((k, v) => {
    const isConnected = connections.some((c) => c.to.insId === instance.id && c.to.pinId === k);
    const isStatic = isStaticInputPinConfig(instance.inputConfig[k]);

    const isRequired = part.inputs[k] && part.inputs[k]?.mode === "required";

    return !isStatic && (isRequired || isConnected);
  });

  if (visiblePins.length === 0) {
    return [TRIGGER_PIN_ID];
  }

  return visiblePins;
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
  onPinDblClick: (v: PartInstance, k: string, type: PinType, e: React.MouseEvent) => void;
  onDragEnd: (ins: PartInstance, ...data: any[]) => void;
  onDragStart: (ins: PartInstance, ...data: any[]) => void;
  onDragMove: (ins: PartInstance, ev: React.MouseEvent, pos: Pos) => void;
  onSelect: (ins: PartInstance, ev: React.MouseEvent) => void;
  onDblClick: (ins: PartInstance, shiftKey: boolean) => void;
  onToggleSticky: (ins: PartInstance, pinId: string) => void;
  onTogglePinLog: (insId: string, pinId: string, type: PinType) => void;
  onTogglePinBreakpoint: (insId: string, pinId: string, type: PinType) => void;

  onInspectPin: (insId: string, pinId: string, type: PinType) => void;

  onDismantleGroup: (ins: PartInstance) => void;
  onDetachConstValue: (ins: PartInstance, pinId: string) => void;
  onCopyConstValue: (ins: PartInstance, pinId: string) => void;
  onPasteConstValue: (ins: PartInstance, pinId: string) => void;
  onConvertConstToEnv?: (ins: PartInstance, pinId: string) => void;

  onRequestHistory: (insId: string, pinId: string, type: PinType) => Promise<HistoryPayload>;

  onChangeVisibleInputs: (ins: PartInstance, inputs: string[]) => void;
  onChangeVisibleOutputs: (ins: PartInstance, outputs: string[]) => void;

  copiedConstValue?: any;

  displayMode?: true;

  forceShowMinimized?: PinType | "both";
}

export const InstanceView: React.SFC<InstanceViewProps> = function InstanceViewInner(props) {
  const {
    selected,
    selectedInput,
    selectedOutput,
    connectionsPerInput,
    connectionsPerOutput,
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
    partDefRepo,
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
  } = props;

  const { id } = instance;

  const isNative = isNativePart(part);

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

  const _onSelect = React.useCallback((e: any) => onSelect(instance, e), [instance, onSelect]);

  const onDblClick = React.useCallback(
    (e: React.MouseEvent) => onDoubleClick(instance, e.shiftKey),
    [instance, onDoubleClick]
  );

  const is = entries(part.inputs);

  const { visibleInputs, visibleOutputs } = instance;

  if (visibleInputs) {
    is.sort((a, b) => visibleInputs.indexOf(a[0]) - visibleInputs.indexOf(b[0]));
  }

  const os = entries(part.outputs);

  if (visibleOutputs) {
    os.sort((a, b) => visibleOutputs.indexOf(a[0]) - visibleOutputs.indexOf(b[0]));
  }

  const cm = classNames("ins-view", {
    selected,
    dragged,
    native: isNative,
    closest: closestPin && closestPin.ins.id === instance.id,
    "no-inputs": is.length === 0,
    "no-outputs": os.length === 0,
    "display-mode": displayMode,
    "force-minimized-input":
      props.forceShowMinimized === "input" || props.forceShowMinimized === "both",
    "force-minimized-output":
      props.forceShowMinimized === "output" || props.forceShowMinimized === "both",
  });

  const connectedInputs = new Set(
    connections.filter(({ to }) => to.insId === id).map(({ to }) => to.pinId)
  );
  const connectedOutputs = new Set(
    connections.filter(({ from }) => from.insId === id).map(({ from }) => from.pinId)
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

  let customView: any;

  try {
    // customView =
    //   part.customView &&
    //   part.customView(instance, connectionsPerInput, connectionsPerOutput, partDefRepo);
  } catch (e) {
    console.error(`Error rendering custom view for part ${part.id}`);
  }

  const hiddenInputs = (customView && customView.hiddenInputs) || [];
  const hiddenOutputs = (customView && customView.hiddenOutputs) || [];

  const content = calcPartContent(
    instance,
    part
  );

  const getStaticValue = (k: string) => {
    const config = instance.inputConfig[k];
    if (isStaticInputPinConfig(config)) {
      return config.value;
    }
  };

  const isUsingError = connectedOutputs.has(ERROR_PIN_ID);
  const [showError, setShowError] = React.useState(isUsingError);

  if (showError) {
    os.push([ERROR_PIN_ID, partOutput("error")]);
  }

  const _onChangeVisibleInputs = React.useCallback(async () => {
    const inputs = okeys(part.inputs);
    const res = await _prompt("New order?", (instance.visibleInputs || inputs).join(","));
    if (res) {
      onChangeVisibleInputs(instance, res.split(","));
    }
  }, [part.inputs, _prompt, instance, onChangeVisibleInputs]);

  const _onChangeVisibleOutputs = React.useCallback(async () => {
    const outputs = okeys(part.outputs);
    const res = await _prompt("New order?", (instance.visibleOutputs || outputs).join(","));
    if (res) {
      onChangeVisibleOutputs(instance, res.split(","));
    }
  }, [part.outputs, _prompt, instance, onChangeVisibleOutputs]);

  const contextMenuItems = [
    {
      label: showError
        ? `Hide Error ${isUsingError ? "(is used, disconnect first)" : ""}`
        : `Show Error Pin`,
      callback: () => !isUsingError && setShowError(!showError),
      disabled: isUsingError,
    },
    ...(isGroupedPart(part)
      ? [{ label: "Dismantle Group", callback: () => props.onDismantleGroup(instance) }]
      : []),
    { label: `Ins id: ${instance.id}`, callback: noop },
    {
      label: `Copy part - "${isInlinePartInstance(instance) ? instance.part.id : instance.partId}"`,
      callback: async () => {
        const str = JSON.stringify(part, null, 4);
        await navigator.clipboard.writeText(str);
        toastMsg("Copied!");
      },
    },
    { label: "Reorder inputs", callback: _onChangeVisibleInputs },
    { label: "Reorder outputs", callback: _onChangeVisibleOutputs },
  ];

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

  is.push([TRIGGER_PIN_ID, partInput("trigger")]);

  const _visibleInputs =
    instance.visibleInputs || getDefaultVisibleInputs(instance, part, connections);

  const inputsToRender = is.filter(([k]) => {
    return _visibleInputs.includes(k);
  });

  const outputsToRender = os.filter(([k]) => {
    return !hiddenOutputs.includes(k);
  });

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
            isPart={v.type.indexOf("part") === 0}
            isClosestToMouse={!!closestPin && closestPin.type === "input" && closestPin.pin === k}
            onToggleLogged={onTogglePinLog}
            onToggleBreakpoint={onTogglePinBreakpoint}
            onInspect={props.onInspectPin}
            constValue={getStaticValue(k)}
            // constValue={constInputs && constInputs.get(k) && (constInputs.get(k) as any).val}
            dataType={v.type}
            onRequestHistory={_onRequestHistory}
            onConvertConstToEnv={props.onConvertConstToEnv ? _onConvertConstToEnv : undefined}
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
            optional={v.optional}
            isClosestToMouse={!!closestPin && closestPin.type === "output" && closestPin.pin === k}
            selected={k === selectedOutput}
            onClick={onOutputClick}
            onDoubleClick={onOutputDblClick}
            onToggleLogged={onTogglePinLog}
            onToggleBreakpoint={onTogglePinBreakpoint}
            dataType={v.type}
            onInspect={props.onInspectPin}
            onRequestHistory={_onRequestHistory}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={cm} data-part-id={part.id}>
      <BasePartView
        label={content}
        onClick={_onSelect}
        onDoubleClick={onDblClick}
        selected={selected}
        pos={instance.pos}
        viewPort={viewPort}
        onDragStart={_onDragStart}
        onDragMove={_onDragMove}
        onDragEnd={_onDragEnd}
        contextMenuItems={contextMenuItems}
        upperRenderer={renderInputs}
        bottomRenderer={renderOutputs}
        displayMode={displayMode}
        domId={getInstanceDomId(props.parentInsId, instance.id)}
      />
    </div>
  );
};
