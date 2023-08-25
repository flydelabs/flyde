import React from "react";

import { Icon, Intent } from "@blueprintjs/core";
import { Tooltip } from "@blueprintjs/core";
import { InfoSign } from "@blueprintjs/icons";
import { Classes } from "@blueprintjs/core";

export interface InfoTooltipProps {
  content: string | JSX.Element;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = (props) => {
  const { content } = props;
  return (
    <Tooltip content={content} placement="top" className="info-tooltip">
      <Icon
        icon={<InfoSign className={Classes.INTENT_PRIMARY} />}
        intent={Intent.SUCCESS}
        className="info-tooltip-icon"
      />
    </Tooltip>
  );
};
