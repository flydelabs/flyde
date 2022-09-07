import * as React from "react";
import classNames from "classnames";

import { Menu, MenuItem, ContextMenu } from "@blueprintjs/core";

// ;

import { isDefined, toString } from "../../utils";

import { useState } from "react";
import { isEnvValue, PinType, TRIGGER_PIN_ID } from "@flyde/core";
import { ERROR_PIN_ID } from "@flyde/core";
import { getPinDomId } from "../dom-ids";
import { HistoryPayload, valuePreview } from "@flyde/remote-debugger";
import CustomReactTooltip from "../../lib/tooltip";
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
  isPart: boolean;
  constValue?: any;
  queueSize?: number;
};

export type OutputPinViewProps = {
  type: "output";
};

export type PinViewProps = {
  optional?: boolean;
  id: string;
  insId: string;
  parentInsId: string;
  dataType: string;
  selected: boolean;
  connected: boolean;
  minimized: boolean;
  onDoubleClick?: (id: string, e?: React.MouseEvent) => void;
  onShiftClick?: (id: string, e?: React.MouseEvent) => void;
  onClick: (id: string, type: PinType, e?: React.MouseEvent) => void;
  rotate?: true;
  isClosestToMouse: boolean;
  onToggleLogged: (insId: string, pinId: string, type: PinType) => void;
  onToggleBreakpoint: (insId: string, pinId: string, type: PinType) => void;
  onInspect: (insId: string, pinId: string, type: PinType) => void;
  onRequestHistory: (pinId: string, type: PinType) => Promise<HistoryPayload>;
} & (InputPinViewProps | OutputPinViewProps);

export interface OptionalPinViewProps {
  options: string[];
  onSelect: (k: string) => void;
}

const INSIGHTS_TOOLTIP_INTERVAL = 500;

const getDisplayId = (id: string) => {
  switch (id) {
    case TRIGGER_PIN_ID:
      return "Trigger";
    case ERROR_PIN_ID:
      return "Error";
    default:
      return id;
  }
};

export const PinView: React.SFC<PinViewProps> = React.memo(function PinView(props) {
  const {
    selected,
    type,
    connected,
    rotate,
    optional,
    isClosestToMouse,
    dataType: pinType,
    id,
    onRequestHistory,
  } = props;

  const displayLabel = getDisplayId(id);

  const [history, setHistory] = useState<HistoryPayload>();

  const getContextMenu = () => {
    const logMenuItem = (
      <MenuItem
        onClick={() => props.onToggleLogged(props.insId, props.id, props.type)}
        // text={logged ? "Stop logging" : "Start logging"}
      />
    );

    const bpMenuItem = (
      <MenuItem
        onClick={() => props.onToggleBreakpoint(props.insId, props.id, props.type)}
        // text={breakpoint ? "Remove breakpoint" : "Add breakpoint"}
      />
    );

    const inspectMenuItem = (
      <MenuItem
        onClick={() => props.onInspect(props.insId, props.id, props.type)}
        text={"Inspect"}
      />
    );
    if (props.type === "input") {
      const { onConvertConstToEnv } = props;
      if (isDefined(maybeConstValue)) {
        return (
          <Menu>
            <MenuItem onClick={() => props.onDetachConstValue(props.id)} text={"Detach value"} />
            <MenuItem onClick={() => props.onCopyConstValue(props.id)} text={"Copy value"} />
            {isDefined(props.copiedConstValue) ? (
              <MenuItem onClick={() => props.onPasteConstValue(props.id)} text="Paste value" />
            ) : null}
            {onConvertConstToEnv ? (
              <MenuItem onClick={() => onConvertConstToEnv(props.id)} text="Convert to Env Var" />
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
              <MenuItem onClick={() => props.onPasteConstValue(props.id)} text="Paste value" />
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
    ContextMenu.show(menu, { left: e.pageX, top: e.pageY });
  };

  const onClick = (e: React.MouseEvent) => {
    const { onShiftClick, onClick, id } = props;
    if (e.shiftKey && onShiftClick) {
      onShiftClick(id, e);
    } else {
      onClick(id, type, e);
    }
  };

  const calcClassNames = () => {
    if (props.type === "input") {
      const { isSticky, isPart, constValue } = props;
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
          "is-part": isPart,
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
    props.type === "input" && isDefined(props.constValue) ? props.constValue : undefined;

  const calcTooltipContent = (tip: any) => {
    if (isDefined(maybeConstValue)) {
      return `<div>${displayLabel} (${type})<div>Const Value: <strong>${valuePreview(
        maybeConstValue
      ).substr(0, 200)}</strong></div></div>`;
    }

    if (!history) {
      return `<div>Loading..</div>`;
    }

    const { total, lastSamples } = history;

    const maybeLastValueContent =
      lastSamples.length > 0
        ? `<div>Last value: <strong>${valuePreview(lastSamples[0].val).substr(
            0,
            200
          )}</strong></div>`
        : "";

    return `<div><div>${displayLabel} (${type}) </div>
    <strong>Activated ${total} times this session</strong>
    ${maybeLastValueContent}`;
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

  const historyTimer = React.useRef<any>();

  const refreshHistory = React.useCallback(() => {
    clearInterval(historyTimer.current);
    onRequestHistory(id, type).then((val) => {
      setHistory(val);
    });
    historyTimer.current = setInterval(() => {
      onRequestHistory(id, type).then((val) => {
        setHistory(val);
      });
    }, INSIGHTS_TOOLTIP_INTERVAL);
  }, [onRequestHistory, id, type]);

  const resetHistory = React.useCallback(() => {
    clearInterval(historyTimer.current);
    setHistory(undefined);
  }, []);

  const renderContent = () => {
    return isDefined(maybeConstValue) ? (
      <React.Fragment>
        {displayLabel}: <span className="value">{toString(maybeConstValue)}</span>
      </React.Fragment>
    ) : (
      displayLabel
    );
  };

  return (
    <div className={calcClassNames()} onContextMenu={showMenu} data-pin-id={id}>
      <CustomReactTooltip
        className="insights-tooltip"
        html
        id={id + props.insId}
        getContent={[calcTooltipContent, INSIGHTS_TOOLTIP_INTERVAL / 20]}
      />
      <div
        onMouseEnter={refreshHistory}
        onMouseOut={resetHistory}
        data-tip=""
        data-html={true}
        id={getPinDomId(props.parentInsId, props.insId, id, type)}
        data-for={id + props.insId}
        data-place={tooltipDown ? "bottom" : null}
        onDoubleClick={(e) => props.onDoubleClick && props.onDoubleClick(id, e)}
        className={`pin-inner`}
        onClick={onClick}
      >
        {renderContent()}
        {maybeStickyLabel()}
        {maybeQueueLabel()}
      </div>
      <div className="wire" />
    </div>
  );
});
