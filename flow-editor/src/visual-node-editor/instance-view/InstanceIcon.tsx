import React from "react";
import { NodeTypeIcon } from "@flyde/core";
import { BaseNodeIcon } from "../base-node-view/BaseNodeView";
import classNames from "classnames";

interface InstanceIconProps {
  icon?: NodeTypeIcon;
  className?: string;
}

export const InstanceIcon: React.FC<InstanceIconProps> = ({
  icon,
  className,
}) => {
  return (
    <span className={classNames("instance-icon", className)}>
      <BaseNodeIcon icon={icon} />
    </span>
  );
};
