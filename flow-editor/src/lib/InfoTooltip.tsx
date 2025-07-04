import React from "react";

import { Info } from "../ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui";

export interface InfoTooltipProps {
  content: string | JSX.Element;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = (props) => {
  const { content } = props;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-primary cursor-help" />
        </TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
