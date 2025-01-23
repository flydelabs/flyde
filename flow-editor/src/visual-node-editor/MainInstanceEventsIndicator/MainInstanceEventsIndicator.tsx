import React from "react";
import { ViewPort } from "../..";
import { getMainInstanceIndicatorDomId } from "../dom-ids";
import { calcHistoryContent, useHistoryHelpers } from "../pin-view/helpers";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flyde/ui";

export interface MainInstanceEventsIndicatorProps {
  currentInsId: string;
  ancestorsInsIds?: string;
  viewPort: ViewPort;
}

export const MainInstanceEventsIndicator: React.FC<
  MainInstanceEventsIndicatorProps
> = (props) => {
  const { currentInsId, ancestorsInsIds } = props;

  const { history, refreshHistory, resetHistory } =
    useHistoryHelpers(currentInsId);

  const calcTooltipContent = () => {
    return calcHistoryContent(history);
  };

  return (
    <div className="main-instance-events-indicator">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              onMouseEnter={refreshHistory}
              onMouseOut={resetHistory}
              id={getMainInstanceIndicatorDomId(currentInsId, ancestorsInsIds)}
              className="status-text"
            ></span>
          </TooltipTrigger>
          <TooltipContent>{calcTooltipContent()}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
