import * as React from "react";
import { IconProps, defaultProps } from "./types";

export function ChevronRight(props: IconProps) {
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
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
