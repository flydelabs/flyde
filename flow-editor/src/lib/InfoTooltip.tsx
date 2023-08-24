import React from "react";

import { Icon } from "@blueprintjs/core";
import { Tooltip } from "@blueprintjs/core";

export interface InfoTooltipProps {
  content: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = (props) => {
  const { content } = props;
  return (
    <Tooltip content={content} placement="top" className="info-tooltip">
      <Icon icon="info-sign" intent="primary" className="info-tooltip-icon" />
    </Tooltip>
  );
};
