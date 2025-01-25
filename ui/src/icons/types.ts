import * as React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

export const defaultProps = {
  size: 24,
  strokeWidth: 2,
};
