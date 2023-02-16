import * as React from "react";
import classNames from "classnames";

import { Menu, MenuItem, ContextMenu } from "@blueprintjs/core";

import { isDefined, toString } from "../../utils";

import { getInputName, getOutputName, isEnvValue, PinType } from "@flyde/core";
import { getPinDomId } from "../dom-ids";
import { HistoryPayload, valuePreview } from "@flyde/remote-debugger";
import CustomReactTooltip from "../../lib/tooltip";
import { calcHistoryContent, useHistoryHelpers } from "./helpers";
export const PIN_HEIGHT = 23;

export type InputPinViewProps = {
  type: "input";
  onToggleSticky: (id: string) => void;
  onDetachConstValue: (id: string) => void;
  onCopyConstValue: (id: string) => void;
  onPasteConstValue: (id: string) => void;
  onConvertConstToEnv?: (id: string) => void;
  copiedConstValue?: any;
  isSticky: boolean;
  constValue?: any;
  queueSize?: number;
  queuedValues: number;
};

export type OutputPinViewProps = {
  type: "output";
};

export type PinViewProps = {
  optional?: boolean;
  id: string;
  insId: string;
  parentInsId: string;
  selected: boolean;
  connected: boolean;
  minimized: boolean;
  onDoubleClick?: (id: string, e?: React.MouseEvent) => void;
  onShiftClick?: (id: string, e?: React.MouseEvent) => void;
  onClick: (id: string, type: PinType, e?: React.MouseEvent) => void;
  rotate?: true;
  isClosestToMouse: boolean;
  description?: string;
  onToggleLogged: (insId: string, pinId: string, type: PinType) => void;
  onToggleBreakpoint: (insId: string, pinId: string, type: PinType) => void;
  onInspect: (insId: string, pin: {id: string, type: PinType}) => void;
  onRequestHistory: (pinId: string, type: PinType) => Promise<HistoryPayload>;
} & (InputPinViewProps | OutputPinViewProps);

export interface OptionalPinViewProps {
  options: string[];
  onSelect: (k: string) => void;
}

const INSIGHTS_TOOLTIP_INTERVAL = 500;

export const PinView: React.SFC<PinViewProps> = React.memo(function PinView(
  props
) {
  const {
    selected,
    type,
    connected,
    rotate,
    optional,
    isClosestToMouse,
    id,
    onRequestHistory,
  } = props;

  const { history, resetHistory, refreshHistory } = useHistoryHelpers(
    onRequestHistory,
    id,
    type
  );

  const getContextMenu = () => {
    const logMenuItem = (
      <MenuItem
        onClick={() => props.onToggleLogged(props.insId, props.id, props.type)}
        // text={logged ? "Stop logging" : "Start logging"}
      />
    );

    const bpMenuItem = (
      <MenuItem
        onClick={() =>
          props.onToggleBreakpoint(props.insId, props.id, props.type)
        }
        // text={breakpoint ? "Remove breakpoint" : "Add breakpoint"}
      />
    );

    const inspectMenuItem = (
      <MenuItem
        onClick={() => props.onInspect(props.insId, {id: props.id, type: props.type})}
        text={"Inspect"}
      />
    );
    if (props.type === "input") {
      const { onConvertConstToEnv } = props;
      if (isDefined(maybeConstValue)) {
        return (
          <Menu>
            <MenuItem
              onClick={() => props.onDetachConstValue(props.id)}
              text={"Detach value"}
            />
            <MenuItem
              onClick={() => props.onCopyConstValue(props.id)}
              text={"Copy value"}
            />
            {isDefined(props.copiedConstValue) ? (
              <MenuItem
                onClick={() => props.onPasteConstValue(props.id)}
                text="Paste value"
              />
            ) : null}
            {onConvertConstToEnv ? (
              <MenuItem
                onClick={() => onConvertConstToEnv(props.id)}
                text="Convert to Env Var"
              />
            ) : null}
          </Menu>
        );
      } else {
        return (
          <Menu>
            <MenuItem
              onClick={() => props.onToggleSticky(props.id)}
              text={"Toggle sticky (square means sticky)"}
            />
            {logMenuItem}
            {bpMenuItem}
            {inspectMenuItem}
            {isDefined(props.copiedConstValue) ? (
              <MenuItem
                onClick={() => props.onPasteConstValue(props.id)}
                text="Paste value"
              />
            ) : null}
          </Menu>
        );
      }
    } else {
      return (
        <Menu>
          {logMenuItem}
          {bpMenuItem}
          {inspectMenuItem}
        </Menu>
      );
    }
  };

  const showMenu = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    const menu = getContextMenu();
    ContextMenu.show(menu, { left: e.clientX, top: e.clientY });
  };

  const onClick = (e: React.MouseEvent) => {
    const { onShiftClick, onClick, id } = props;
    if (e.shiftKey && onShiftClick) {
      onShiftClick(id, e);
    } else {
      onClick(id, type, e);
    }
  };

  const displayName = type === "input" ? getInputName(id) : getOutputName(id);

  const calcClassNames = () => {
    if (props.type === "input") {
      const { isSticky, constValue } = props;
      return classNames(
        "pin",
        {
          sticky: isSticky,
          selected,
          closest: isClosestToMouse,
          optional,
          connected,
          rotate,
          "const-value": isDefined(constValue),
          "env-value": isDefined(constValue) && isEnvValue(constValue),
          // "is-logged": logged,
          // "is-breakpoint": breakpoint,
          minimized: props.minimized,
        },
        type
      );
    } else {
      return classNames(
        "pin",
        {
          selected,
          connected,
          closest: isClosestToMouse,
          rotate,
          optional,
          // "is-logged": logged,
          // "has-value": isDefined(runtimeData.lastValues.length)
          minimized: props.minimized,
        },
        type,
        rotate
      );
    }
  };

  const maybeConstValue =
    props.type === "input" && isDefined(props.constValue)
      ? props.constValue
      : undefined;

  const calcTooltipContent = () => {
    const historyContent = calcHistoryContent(history, type === "input" ? props.queuedValues : undefined);

    const maybeDescription = props.description
      ? `<em>${props.description}</em>`
      : "";

    return `<div><div><strong>${displayName}</strong> (${type}) </div>
      ${maybeDescription}
      <hr/>
      ${
        isDefined(maybeConstValue)
          ? `<div>Static value: <strong>${valuePreview(maybeConstValue).substr(
              0,
              200
            )}</strong></div>`
          : historyContent
      }
    `;
  };

  const tooltipDown = rotate && type === "input";

  const maybeStickyLabel = () => {
    if (props.type === "input" && props.isSticky) {
      return <span className="suffix">s</span>;
    } else {
      return null;
    }
  };

  const maybeQueueLabel = () => {
    if (props.type === "input" && props.queueSize) {
      return <span className="suffix">{props.queueSize} in Q</span>;
    } else {
      return null;
    }
  };

  return (
    <div className={calcClassNames()} data-pin-id={id}>
      <CustomReactTooltip
        className="pin-info-tooltip"
        html
        id={id + props.insId}
        getContent={[calcTooltipContent, INSIGHTS_TOOLTIP_INTERVAL / 20]}
      />
      <div
        onMouseEnter={refreshHistory}
        onMouseOut={resetHistory}
        data-tip=""
        data-html={true}
        data-for={id + props.insId}
        id={getPinDomId(props.parentInsId, props.insId, id, type)}
        data-place={tooltipDown ? "bottom" : null}
        onDoubleClick={(e) => props.onDoubleClick && props.onDoubleClick(id, e)}
        className={`pin-inner`}
        onContextMenu={showMenu}
        onClick={onClick}
      >
        {displayName}{" "}
        {isDefined(maybeConstValue) ? (
          <React.Fragment>
            {":"}
            <span className="value">{toString(maybeConstValue)}</span>
          </React.Fragment>
        ) : null}
        {maybeStickyLabel()}
        {maybeQueueLabel()}
      </div>
      <div className="wire" />
    </div>
  );
});
