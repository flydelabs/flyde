import * as React from "react";
import classNames from "classnames";
import { useCallback, useRef, useState } from "react";
import { useHotkeys } from "../../lib/react-utils/use-hotkeys";

import {
  ERROR_PIN_ID,
  fullInsIdPath,
  PinType,
  TRIGGER_PIN_ID,
} from "@flyde/core";
import { getPinDomId, getPinDomHandleId } from "../dom-ids";
import { getInputName, getOutputName, useHistoryHelpers } from "./helpers";
import { useDarkMode } from "../../flow-editor/DarkModeContext";
import { PinTooltipContent } from "./PinTooltipContent";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../ui";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui";
import { faBolt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
  increasedDropArea?: boolean;
  onDoubleClick?: (id: string, e: React.MouseEvent) => void;
  onShiftClick?: (id: string, e: React.MouseEvent) => void;
  onClick: (id: string, type: PinType, e: React.MouseEvent) => void;
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

const LEAVE_DELAY = 500; // Increased from 200ms to 500ms for better UX
const SHOW_DELAY = 250; // Delay before showing tooltip

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
    onInspect,
  } = props;

  const { history, resetHistory, refreshHistory } = useHistoryHelpers(
    currentInsId,
    id,
    type
  );

  const leaveTimer = useRef<number>();
  const showTimer = useRef<number>();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseEnter = useCallback(() => {
    window.clearTimeout(leaveTimer.current);
    setIsDataLoading(true);
    // Clear previous history data to prevent showing stale data
    resetHistory();

    // Start loading the data
    refreshHistory();

    // Set a delay before showing the tooltip
    showTimer.current = window.setTimeout(() => {
      setIsTooltipOpen(true);
      setTimeout(() => {
        setIsDataLoading(false);
      }, 100);
    }, SHOW_DELAY);
  }, [refreshHistory, resetHistory]);

  const handleMouseLeave = useCallback(() => {
    window.clearTimeout(showTimer.current);

    leaveTimer.current = window.setTimeout(() => {
      if (!isTooltipHovered) {
        resetHistory();
        setIsTooltipOpen(false);
        setIsExpanded(false);
      }
    }, LEAVE_DELAY);
  }, [resetHistory, isTooltipHovered]);

  const handleTooltipMouseEnter = useCallback(() => {
    window.clearTimeout(leaveTimer.current);
    setIsTooltipHovered(true);
  }, []);

  const handleTooltipMouseLeave = useCallback(() => {
    setIsTooltipHovered(false);
    leaveTimer.current = window.setTimeout(() => {
      resetHistory();
      setIsTooltipOpen(false);
      setIsExpanded(false);
    }, LEAVE_DELAY);
  }, [resetHistory]);

  const handleInspect = useCallback(() => {
    onInspect(currentInsId, { id, type });
  }, [currentInsId, id, type, onInspect]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  useHotkeys(
    "cmd+i,ctrl+i",
    (e) => {
      if (isTooltipOpen) {
        e.preventDefault();
        handleInspect();
      }
    },
    {
      text: "Inspect pin value",
      group: "Pin Actions",
    },
    [handleInspect, isTooltipOpen]
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
          "increased-drop-area": props.increasedDropArea,
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
          "increased-drop-area": props.increasedDropArea,
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
        <Tooltip
          open={isTooltipOpen}
          onOpenChange={setIsTooltipOpen}
          key={`tooltip-${currentInsId}-${id}-${type}`}
        >
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
                {id === TRIGGER_PIN_ID ? <FontAwesomeIcon icon={faBolt} /> : displayName}
                {maybeQueueLabel()}
              </ContextMenuTrigger>
            </TooltipTrigger>
            <ContextMenuContent>{getContextMenuContent()}</ContextMenuContent>
          </ContextMenu>
          <TooltipContent
            side="top"
            align="start"
            className="p-0 rounded-md"
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
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
              isLoading={isDataLoading}
              onInspect={handleInspect}
              isExpanded={isExpanded}
              onToggleExpand={toggleExpanded}
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
      >
        <div className={classNames("pin-handle-inner", type, { dark })} />
      </div>
    </div>
  );
});
