import { timeAgo } from "@/lib/timeAgo";
import React from "react";

export function TimeAgo({ date }: { date: Date }) {
  return (
    <React.Fragment>
      <span
        data-tooltip-id="main-tooltip"
        data-tooltip-content={date.toLocaleString()}
      >
        {timeAgo(date)}
      </span>
    </React.Fragment>
  );
}
