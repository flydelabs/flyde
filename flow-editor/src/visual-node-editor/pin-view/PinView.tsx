import * as React from "react";
import classNames from "classnames";
import { useCallback, useRef, useState } from "react";
import { useHotkeys } from "../../lib/react-utils/use-hotkeys";

import {
  ERROR_PIN_ID,
  fullInsIdPath,
  getInputName,
  getOutputName,
  PinType,
} from "@flyde/core";
import { getPinDomId, getPinDomHandleId } from "../dom-ids";
import { useHistoryHelpers } from "./helpers";
import { useDarkMode } from "../../flow-editor/DarkModeContext";
import { PinTooltipContent } from "./PinTooltipContent";

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

const LEAVE_DELAY = 200; // 200ms delay before hiding tooltip

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

  const leaveTimer = useRef<number>();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const handleMouseEnter = useCallback(() => {
    window.clearTimeout(leaveTimer.current);
    refreshHistory();
  }, [refreshHistory]);

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = window.setTimeout(() => {
      resetHistory();
    }, LEAVE_DELAY);
  }, [resetHistory]);

  useHotkeys(
    "cmd+i,ctrl+i",
    (e) => {
      if (isTooltipOpen) {
        e.preventDefault();
        props.onInspect(currentInsId, { id, type });
      }
    },
    {
      text: "Inspect pin value",
      group: "Pin Actions",
    },
    [currentInsId, id, type, props.onInspect, isTooltipOpen]
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

  const onPinHandleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

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
      return classNames(
        "pin",
        {
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
        <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
          <ContextMenu>
            <TooltipTrigger asChild>
              <ContextMenuTrigger
                onMouseEnter={handleMouseEnter}
                onMouseOut={handleMouseLeave}
                id={getPinDomId(idParams)}
                onDoubleClick={(e) => {
                  if (props.onDoubleClick) {
                    props.onDoubleClick(id, e);
                  }
                }}
                className={classNames(`pin-inner`, { dark })}
              >
                {displayName}
                {maybeQueueLabel()}
              </ContextMenuTrigger>
            </TooltipTrigger>
            <ContextMenuContent>{getContextMenuContent()}</ContextMenuContent>
          </ContextMenu>
          <TooltipContent side="top" align="start" className="p-0 rounded-md">
            <PinTooltipContent
              displayName={displayName}
              typeLabel={
                isMain
                  ? type === "input"
                    ? "main output"
                    : "main input"
                  : type
              }
              description={props.description}
              history={history}
              queuedValues={type === "input" ? props.queuedValues : undefined}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div
        className={classNames("pin-handle no-drag", type, {
          closest: isClosestToMouse,
          selected,
          dark,
        })}
        id={getPinDomHandleId(idParams)}
        onMouseDown={(e) => {
          if (e.button === 0) {
            e.stopPropagation(); // Prevent node selection when clicking on pin handle
            onMouseDown(id, type, e);
          }
        }}
        onMouseUp={_onMouseUp}
        onClick={onPinHandleClick}
      />
    </div>
  );
});
