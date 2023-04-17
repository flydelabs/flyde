import React from "react";

import { Icon } from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";

export interface InfoTooltipProps {
  content: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = (props) => {
  const { content } = props;
  return (
    <Tooltip2 content={content} placement="top">
      <Icon icon="info-sign" intent="primary" />
    </Tooltip2>
  );
};
