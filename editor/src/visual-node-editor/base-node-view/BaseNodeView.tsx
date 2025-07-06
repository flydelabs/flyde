/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import classNames from "classnames";
import Draggable from "react-draggable";
import { Pos, NodeTypeIcon } from "@flyde/core";
import { useDarkMode } from "../../flow-editor/DarkModeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "../../ui";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui";

export interface BaseNodeViewContextItem {
  label: string;
  callback: any;
}

export interface BaseNodeViewProps {
  domId?: string;
  className?: string;
  pos: Pos;
  dragged?: boolean;
  viewPort: { pos: Pos; zoom: number };
  displayMode?: true;
  size?: "normal" | "wide";
  diffStatus?: "added" | "removed" | "changed";

  heading?: string;
  description?: string;
  icon?: NodeTypeIcon;
  leftSide?: React.ReactNode;
  rightSide?: React.ReactNode;
  contextMenuContent?: React.ReactNode;
  selected?: boolean;
  dark?: boolean;
  overrideNodeBodyHtml?: string;
  overrideStyle?: React.CSSProperties;

  onDragEnd: (...data: any[]) => void;
  onDragStart: (...data: any[]) => void;
  onDragMove: (ev: React.MouseEvent, pos: Pos) => void;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export interface PinViewProps {
  id: string;
  children?: React.ReactNode;
}

export const BaseNodeIcon: React.FC<{ icon?: NodeTypeIcon }> =
  function BaseNodeIcon({ icon }) {
    if (!icon) {
      return <FontAwesomeIcon icon="code" size="lg" />;
    }
    if (typeof icon === "string" && icon.trim().startsWith("<")) {
      return (
        <span
          className="svg-icon-container flex flex-row items-center justify-center"
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      );
    } else {
      const iconValue = Array.isArray(icon) ? icon[0] : icon;
      if (!iconValue) {
        return <FontAwesomeIcon icon="code" size="lg" />;
      }
      return <FontAwesomeIcon icon={iconValue as any} size="lg" />;
    }
  };

const HOVER_DELAY = 400;

export const BaseNodeView: React.FC<BaseNodeViewProps> =
  function BaseNodeViewInner(props) {
    const {
      dragged,
      viewPort,
      pos,
      onDragEnd,
      onDragMove,
      onDragStart,
      displayMode,
      heading,
      description,
      icon,
      leftSide,
      rightSide,
      contextMenuContent,
      selected,
      onClick,
      onDoubleClick,
      overrideNodeBodyHtml,
      size = "normal",
      diffStatus,
    } = props;

    const dark = useDarkMode();

    const _onDragStart = React.useCallback(
      (event: any, data: any) => {
        onDragStart(event, data);
      },
      [onDragStart]
    );

    const _onDragEnd = React.useCallback(
      (event: any, data: any) => {
        const currPos = pos;
        const dx = (data.x - currPos.x) / viewPort.zoom;
        const dy = (data.y - currPos.y) / viewPort.zoom;
        const newX = currPos.x + dx;
        const newY = currPos.y + dy;

        onDragEnd(event, { ...data, x: newX, y: newY });
      },
      [pos, onDragEnd, viewPort]
    );

    const _onDragMove = React.useCallback(
      (event: any, { x, y }: { x: number; y: number }) => {
        onDragMove(event, { x, y });
      },
      [onDragMove]
    );

    const zoomFixStyle = {
      transform: `scale(${viewPort.zoom})`,
    };

    const cm = classNames("base-node-view", props.className, {
      dragged,
      dark,
      "display-mode": displayMode,
      "bg-green-50/50 dark:bg-green-900/20": diffStatus === "added",
      "bg-red-50/50 dark:bg-red-900/20": diffStatus === "removed",
      "bg-blue-50/50 dark:bg-blue-900/20": diffStatus === "changed",
    });

    const correctX = pos.x * viewPort.zoom - viewPort.pos.x * viewPort.zoom;
    const correctY = pos.y * viewPort.zoom - viewPort.pos.y * viewPort.zoom;

    const dx = correctX - pos.x;
    const dy = correctY - pos.y;

    const fixerStyle: any = {
      transform: `translate(${dx}px, ${dy}px)`,
    };

    const outerCm = classNames("base-node-view-vp-fixer", {
      "display-mode": displayMode,
    });

    const innerCm = classNames("base-node-view-inner", {
      selected,
      dark,
      "no-left-side": !leftSide && !overrideNodeBodyHtml,
      "no-right-side": !rightSide && !overrideNodeBodyHtml,
      "size-wide": size === "wide",
      "bg-green-100/80 border-green-500/30": diffStatus === "added",
      "bg-red-100/80 border-red-500/30": diffStatus === "removed",
      "bg-blue-100/80 border-blue-500/30": diffStatus === "changed",
    });

    const headerCm = classNames("node-header", {
      dark,
      "bg-green-200/80 text-green-900": diffStatus === "added",
      "bg-red-200/80 text-red-900": diffStatus === "removed",
      "bg-blue-200/80 text-blue-900": diffStatus === "changed",
    });

    const bodyCm = classNames("node-body", {
      dark,
      "bg-green-100/80": diffStatus === "added",
      "bg-red-100/80": diffStatus === "removed",
      "bg-blue-100/80": diffStatus === "changed",
    });

    const innerContent = overrideNodeBodyHtml ? (
      <div
        className="node-overridden-body"
        dangerouslySetInnerHTML={{ __html: overrideNodeBodyHtml }}
        style={props.overrideStyle}
      />
    ) : (
      <>
        <div className="left-side">{leftSide}</div>
        <div className={classNames("icon-container", { dark })}>
          <BaseNodeIcon icon={icon} />
        </div>
        <div className="right-side">{rightSide}</div>
      </>
    );

    const content = (
      <div className={innerCm}>
        <TooltipProvider>
          <Tooltip delayDuration={HOVER_DELAY}>
            <TooltipTrigger asChild>
              <div className={headerCm}>{heading}</div>
            </TooltipTrigger>
            {description && (
              <TooltipContent side="top">{description}</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <div className={bodyCm}>{innerContent}</div>
      </div>
    );

    const dragNodeRef = React.useRef<HTMLDivElement>(null);

    const draggableContent = (
      <span className="base-node-view-wrapper" ref={dragNodeRef}>
        <div className={cm} style={zoomFixStyle} id={props.domId}>
          <ContextMenu>
            <ContextMenuTrigger
              onClick={onClick}
              onDoubleClick={onDoubleClick}
              className={classNames({ dark })}
            >
              {content}
            </ContextMenuTrigger>
            {contextMenuContent}
          </ContextMenu>
        </div>
      </span>
    );


    return (
      <div className={outerCm} style={fixerStyle}>
        <Draggable
          onStop={_onDragEnd}
          onStart={_onDragStart}
          onDrag={_onDragMove}
          position={pos}
          cancel=".no-drag"
          nodeRef={dragNodeRef}
        >
          {draggableContent}
        </Draggable>
      </div>
    );
  };
