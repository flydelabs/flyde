import React from "react";
import { ViewPort } from "../..";
import { useDebuggerContext } from "../../flow-editor/DebuggerContext";
import CustomReactTooltip from "../../lib/tooltip";
import { getMainInstanceIndicatorDomId } from "../dom-ids";
import { calcHistoryContent, useHistoryHelpers } from "../pin-view/helpers";

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

  const ttId = `main-indicator-${currentInsId}}`;

  return (
    <div className="main-instance-events-indicator">
      <CustomReactTooltip html getContent={[calcTooltipContent, 200]} id={ttId} />
      <span
        onMouseEnter={refreshHistory}
        onMouseOut={resetHistory}
        id={getMainInstanceIndicatorDomId(currentInsId, ancestorsInsIds)}
        className="status-text"
		data-tip=""
		data-html={true}
        data-for={ttId}
      ></span>
    </div>
  );
};

/*
<CustomReactTooltip
          className="pin-info-tooltip"
          html
          id={id + props.currentInsId}
          getContent={[calcTooltipContent, INSIGHTS_TOOLTIP_INTERVAL / 20]}
        />
        <div
          onMouseEnter={refreshHistory}
          onMouseOut={resetHistory}
          onMouseUp={_onMouseUp}
          onMouseDown={_onMouseDown}
          data-tip=""
          data-html={true}
          data-for={id + props.currentInsId}
          className={classNames("part-io-view-inner", { closest, selected })}
          id={getPinDomId({fullInsIdPath: fullInsIdPath(props.currentInsId, props.ancestorInsIds), pinId: id, pinType: type, isMain: true})}
          onClick={_onClick}
          onDoubleClick={onDblClickInner}
          onContextMenu={showMenu}
        >
		*/
