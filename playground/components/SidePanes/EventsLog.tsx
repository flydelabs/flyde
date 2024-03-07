import { EventsViewer } from "./EventsViewer";
import { InfoTooltip } from "../InfoToolip";
import { useState } from "react";
import { DebuggerEvent } from "@flyde/core";
import { SidePane } from "./SidePane";
import React from "react";

export interface EventsLogProps {
  events: DebuggerEvent[];
  clearEvents: () => void;
}

export function EventsLog(props: EventsLogProps) {
  const { events, clearEvents } = props;
  const [showAllEvents, setShowAllEvents] = useState(false);

  const header = (
    <React.Fragment>
      <span className="font-semibold">Debug Events</span>
      <div className="flex items-center">
        <input
          id="default-checkbox"
          type="checkbox"
          checked={showAllEvents}
          onChange={(e) => setShowAllEvents(e.target.checked)}
        />
        <label
          htmlFor="default-checkbox"
          className="ml-1 text-xs font-medium text-gray-900 dark:text-gray-300"
        >
          Include lifecycle events{" "}
          <InfoTooltip content="By default, only new input, output and error events are shown. Select this to view processing state change events, and input queue size change events." />
        </label>
      </div>
      <button
        onClick={() => clearEvents()}
        className="justify-end justify-items-end content-end ml-auto text-sm"
      >
        Clear
      </button>
    </React.Fragment>
  );

  return (
    <SidePane header={header}>
      <div className="flex-1 max-h-52">
        <EventsViewer events={events} showAllEvents={showAllEvents} />
      </div>
    </SidePane>
  );
}
