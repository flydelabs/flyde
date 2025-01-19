/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import classNames from "classnames";
import Draggable from "react-draggable";
import { Pos, NodeTypeIcon } from "@flyde/core";
import { useDarkMode } from "../../flow-editor/DarkModeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ContextMenu,
  Tooltip,
  ContextMenuContentProps,
} from "@blueprintjs/core";

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

  heading?: string;
  description?: string;
  icon?: NodeTypeIcon;
  leftSide?: React.ReactNode;
  rightSide?: React.ReactNode;
  contextMenuContent?:
    | JSX.Element
    | ((props: ContextMenuContentProps) => JSX.Element);
  selected?: boolean;
  dark?: boolean;
  overrideNodeBodyHtml?: string;

  onDragEnd: (...data: any[]) => void;
  onDragStart: (...data: any[]) => void;
  onDragMove: (ev: React.MouseEvent, pos: Pos) => void;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const BaseNodeIcon: React.FC<{ icon?: NodeTypeIcon }> =
  function BaseNodeIcon({ icon }) {
    if (!icon) {
      return <FontAwesomeIcon icon="code" size="lg" />;
    }
    if (typeof icon === "string" && icon.trim().startsWith("<")) {
      return (
        <span
          className="svg-icon-container"
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      );
    } else {
      const iconValue = Array.isArray(icon) ? icon[0] : icon;
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
    });

    const innerContent = overrideNodeBodyHtml ? (
      <div
        className="node-overridden-body"
        dangerouslySetInnerHTML={{ __html: overrideNodeBodyHtml }}
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
        <div className={classNames("node-header", { dark })}>{heading}</div>
        <div className={classNames("node-body", { dark })}>{innerContent}</div>
      </div>
    );

    const draggableContent = (
      <span className="base-node-view-wrapper">
        <div className={cm} style={zoomFixStyle} id={props.domId}>
          <ContextMenu
            className={classNames({ dark })}
            content={contextMenuContent}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
          >
            <Tooltip
              className={classNames({ dark })}
              content={description}
              hoverOpenDelay={HOVER_DELAY}
              placement="top"
            >
              {content}
            </Tooltip>
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
        >
          {draggableContent}
        </Draggable>
      </div>
    );
  };
