import * as React from "react";
import { IconProps, defaultProps } from "./types";

export function Circle(props: IconProps) {
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
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
