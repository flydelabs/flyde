import "react-tooltip/dist/react-tooltip.css";

import { Tooltip } from "react-tooltip";
import React from "react";

export interface IconBtnProps {
  svgIcon: React.ReactNode;

  tooltip?: string;
  disabledTooltip?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function IconBtn(props: IconBtnProps) {
  return (
    <React.Fragment>
      <button
        data-tooltip-id="icon-btn-tooltip"
        disabled={!!props.disabled}
        data-tooltip-content={
          props.disabled ? props.disabledTooltip : props.tooltip
        }
        onClick={props.onClick}
        className={`w-6 h-6 fill-blue-500 hover:fill-blue-400 cursor-pointer disabled:cursor-default disabled:fill-slate-400 ${props.className}`}
      >
        {props.svgIcon}
      </button>
      <Tooltip id="icon-btn-tooltip" />
    </React.Fragment>
  );
}
