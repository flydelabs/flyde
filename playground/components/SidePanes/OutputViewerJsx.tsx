import { SidePane } from "./SidePane";
import React from "react";
import { Timestamp } from "../Utils/Timestamp";

export interface OutputViewerJsxProps {
  events: { value: any; timestamp: number; key: string }[];
}

export function OutputViewerJsx(props: OutputViewerJsxProps) {
  const { events } = props;

  const header = <span className="font-semibold">JSX Output </span>;

  const lastJsxEvent = events.find((ev) => ev.key === "jsx");

  const inner = lastJsxEvent ? (
    lastJsxEvent.value
  ) : (
    <span>JSX output values will appear here</span>
  );

  return (
    <SidePane header={header} grow>
      <div className="flex flex-row justify-center py-10 px-2">{inner}</div>
    </SidePane>
  );
}
