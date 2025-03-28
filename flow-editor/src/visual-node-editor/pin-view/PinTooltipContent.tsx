import { HistoryPayload } from "@flyde/remote-debugger";
import * as React from "react";
import { cn } from "../../lib/utils";
import { formatTimeAgo } from "../../lib/format-time";
import { HotkeyIndication } from "@flyde/ui";

interface PinTooltipContentProps {
  displayName: string;
  typeLabel: string;
  description?: string;
  history?: HistoryPayload;
  queuedValues?: number;
  className?: string;
}

export const PinTooltipContent = ({
  displayName,
  typeLabel: type,
  description,
  history,
  className,
}: PinTooltipContentProps) => {
  const renderHistoryContent = () => {
    if (!history) {
      return "Loading session data..";
    }

    const { lastSamples } = history;

    if (lastSamples.length === 0) {
      return <div className="pt-1">No values received</div>;
    }

    const lastValue = lastSamples[0]?.val;
    const lastTime = lastSamples[0]?.time;
    const valueType =
      typeof lastValue === "object" ? "object" : typeof lastValue;
    const formattedValue =
      typeof lastValue === "object"
        ? JSON.stringify(lastValue, null, 2)
        : String(lastValue);

    return (
      <div>
        <div className="flex justify-between items-center py-2">
          <span>Last value:</span>
          <span>Type: {valueType}</span>
        </div>
        <div className="bg-[#1e1e1e] p-2 border border-neutral-700 rounded">
          <pre className="m-0 whitespace-pre-wrap break-words font-mono text-xs max-h-[150px] overflow-clip">
            {formattedValue}
          </pre>
        </div>
        <div className="p-2 text-xs flex flex-row justify-between items-center font-semibold">
          <span className="font-semibold">Last: {formatTimeAgo(lastTime ?? 0)}</span>
          <span className="font-semibold">Total: {lastSamples.length}</span>
          <HotkeyIndication hotkey="cmd+i" label="View all" />
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "w-[300px] overflow-hidden rounded-md p-0 bg-gradient-to-b from-black to-[#222] text-white border border-neutral-700",
        className
      )}
    >
      <div className="bg-[#383838] border-b border-neutral-700 py-[2px] px-2 rounded-t-md">
        <strong className="mr-1.5 text-sm font-bold">{displayName}</strong>{" "}
        <span className="text-[10px] capitalize">{type}</span>
      </div>
      <div className="py-1 px-2 rounded-b-md">
        {description && (
          <div className="py-2 text-neutral-400 border-b border-neutral-700">
            {description}
          </div>
        )}
        {renderHistoryContent()}
      </div>
    </div>
  );
};
