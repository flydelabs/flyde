import * as React from "react";
import { IconProps, defaultProps } from "./types";

export function ChevronDown(props: IconProps) {
  const { size, strokeWidth, ...rest } = { ...defaultProps, ...props };
  return (
    <svg
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      {...rest}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
