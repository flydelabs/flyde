import * as React from "react";
import { IconProps, defaultProps } from "./types";

export function Play(props: IconProps) {
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
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
