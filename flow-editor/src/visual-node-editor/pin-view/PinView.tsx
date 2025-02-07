import * as React from "react";
import classNames from "classnames";

import {
  ERROR_PIN_ID,
  fullInsIdPath,
  getInputName,
  getOutputName,
  PinType,
} from "@flyde/core";
import { getPinDomId, getPinDomHandleId } from "../dom-ids";
import { calcHistoryContent, useHistoryHelpers } from "./helpers";
import { useDarkMode } from "../../flow-editor/DarkModeContext";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@flyde/ui";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flyde/ui";

export type InputPinViewProps = {
  type: "input";
  onToggleSticky: (id: string) => void;
  isSticky: boolean;
  queueSize?: number;
  queuedValues: number;
};

export type OutputPinViewProps = {
  type: "output";
};

export type PinViewProps = {
  optional?: boolean;
  id: string;
  currentInsId: string;
  ancestorsInsIds?: string;
  selected: boolean;
  connected: boolean;
  onDoubleClick?: (id: string, e?: React.MouseEvent) => void;
  onShiftClick?: (id: string, e?: React.MouseEvent) => void;
  onClick: (id: string, type: PinType, e?: React.MouseEvent) => void;
  isClosestToMouse: boolean;
  description?: string;
  onToggleLogged: (insId: string, pinId: string, type: PinType) => void;
  onToggleBreakpoint: (insId: string, pinId: string, type: PinType) => void;
  onInspect: (insId: string, pin: { id: string; type: PinType }) => void;

  onMouseUp: (id: string, type: PinType, e: React.MouseEvent) => void;
  onMouseDown: (id: string, type: PinType, e: React.MouseEvent) => void;
  isMain: boolean;
} & (InputPinViewProps | OutputPinViewProps);

export interface OptionalPinViewProps {
  options: string[];
  onSelect: (k: string) => void;
}

const INSIGHTS_TOOLTIP_INTERVAL = 500;

export const PinView: React.FC<PinViewProps> = React.memo(function PinView(
  props
) {
  const {
    selected,
    type,
    connected,
    optional,
    currentInsId,
    isClosestToMouse,
    id,
    onMouseDown,
    onMouseUp,
    isMain,
  } = props;

  const { history, resetHistory, refreshHistory } = useHistoryHelpers(
    currentInsId,
    id,
    type
  );

  const dark = useDarkMode();

  const getContextMenuContent = () => {
    const inspectItem = (
      <ContextMenuItem
        onClick={() =>
          props.onInspect(props.currentInsId, {
            id: props.id,
            type: props.type,
          })
        }
      >
        Inspect
      </ContextMenuItem>
    );

    if (props.type === "input") {
      return (
        <>
          <ContextMenuItem onClick={() => props.onToggleSticky(props.id)}>
            Toggle sticky
          </ContextMenuItem>
          {inspectItem}
        </>
      );
    } else {
      return inspectItem;
    }
  };

  const onClick = (e: React.MouseEvent) => {
    const { onShiftClick, onClick, id } = props;
    e.stopPropagation();
    if (e.shiftKey && onShiftClick) {
      onShiftClick(id, e);
    } else {
      onClick(id, type, e);
    }
  };

  const displayName = type === "input" ? getInputName(id) : getOutputName(id);

  const calcClassNames = () => {
    if (props.type === "input") {
      const { isSticky } = props;
      return classNames(
        "pin",
        {
          sticky: isSticky,
          selected,
          closest: isClosestToMouse,
          optional,
          connected,
          dark,
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
          optional,
          "error-pin": id === ERROR_PIN_ID,
          dark,
        },
        type
      );
    }
  };

  const calcTooltipContent = () => {
    const historyContent = calcHistoryContent(
      history,
      type === "input" ? props.queuedValues : undefined
    );

    const maybeDescription = props.description ? (
      <em>{props.description}</em>
    ) : (
      ""
    );

    return (
      <div className="pin-info-tooltip">
        <div>
          <strong>{displayName}</strong> ({type}){" "}
        </div>
        {maybeDescription}
        <hr />
        {historyContent}
      </div>
    );
  };

  const maybeQueueLabel = () => {
    if (props.type === "input" && props.queueSize) {
      return <span className="suffix">{props.queueSize} in Q</span>;
    } else {
      return null;
    }
  };

  const _onMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        onMouseDown(id, type, e);
      }
    },
    [id, type, onMouseDown]
  );

  const _onMouseUp = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        onMouseUp(id, type, e);
      }
    },
    [id, type, onMouseUp]
  );

  const idParams = {
    fullInsIdPath: fullInsIdPath(props.currentInsId, props.ancestorsInsIds),
    pinId: id,
    pinType: isMain ? (type === "input" ? "output" : "input") : type,
    isMain,
  };

  return (
    <div className={calcClassNames()} data-pin-id={id}>
      <TooltipProvider>
        <Tooltip>
          <ContextMenu>
            <TooltipTrigger asChild>
              <ContextMenuTrigger
                onMouseEnter={refreshHistory}
                onMouseOut={resetHistory}
                data-tip=""
                data-html={true}
                data-for={id + props.currentInsId}
                id={getPinDomId(idParams)}
                onDoubleClick={(e) =>
                  props.onDoubleClick && props.onDoubleClick(id, e)
                }
                className={classNames(`pin-inner`, { dark })}
                onClick={onClick}
              >
                {displayName}
                {maybeQueueLabel()}
              </ContextMenuTrigger>
            </TooltipTrigger>
            <ContextMenuContent>{getContextMenuContent()}</ContextMenuContent>
          </ContextMenu>
          <TooltipContent className={classNames("pin-info-tooltip", { dark })}>
            {calcTooltipContent()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div
        className={classNames("pin-handle", type, {
          closest: isClosestToMouse,
          selected,
          dark,
        })}
        id={getPinDomHandleId(idParams)}
        onMouseDown={_onMouseDown}
        onMouseUp={_onMouseUp}
        onClick={onClick}
      />
    </div>
  );
});
