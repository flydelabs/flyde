import { HistoryPayload } from "@flyde/core";
import * as React from "react";
import { cn } from "../../lib/utils";
import { formatTimeAgo } from "../../lib/format-time";
import { HotkeyIndication } from "../../ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faSpinner } from "@fortawesome/free-solid-svg-icons";

interface PinTooltipContentProps {
  displayName: string;
  typeLabel: string;
  description?: string;
  history?: HistoryPayload;
  queuedValues?: number;
  className?: string;
  isLoading?: boolean;
  onInspect?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const PinTooltipContent = ({
  displayName,
  typeLabel: type,
  description,
  history,
  className,
  isLoading = false,
  onInspect,
  isExpanded = false,
  onToggleExpand,
}: PinTooltipContentProps) => {

  const indication = <HotkeyIndication
    hotkey="cmd+i"
    label="View all"
    className="text-neutral-700 opacity-80 dark:text-white"
  />
  const renderHistoryContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col">
          <div className="flex justify-between items-center py-2">
            <span>Last value:</span>
            <span>Type: -</span>
          </div>
          <div className="bg-[#1e1e1e] p-2 border border-neutral-700 rounded">
            <div className="min-h-[60px] flex items-center justify-center">
              <div className="text-sm text-neutral-400 animate-pulse">Loading data...</div>
            </div>
          </div>
          <div className="p-2 text-xs flex flex-row justify-between items-center font-semibold">
            <span className="font-semibold">Last: -</span>
            <span className="font-semibold">Total: -</span>
            <div
              className="cursor-default opacity-50"
              title="Loading data..."
            >
              {indication}
            </div>
          </div>
        </div>
      );
    }

    if (!history) {
      return (
        <div className="flex flex-col">
          <div className="flex justify-between items-center py-2">
            <span>Last value:</span>
            <span>Type: -</span>
          </div>
          <div className="bg-[#1e1e1e] p-2 border border-neutral-700 rounded">
            <div className="min-h-[60px] flex items-center justify-center">
              <div className="text-sm text-neutral-400">No session data available</div>
            </div>
          </div>
          <div className="p-2 text-xs flex flex-row justify-between items-center font-semibold">
            <span className="font-semibold">Last: -</span>
            <span className="font-semibold">Total: -</span>
            <div
              className="cursor-default opacity-50"
              title="No data to inspect"
            >
              {indication}
            </div>
          </div>
        </div>
      );
    }

    const { lastSamples } = history;

    if (lastSamples.length === 0) {
      return (
        <div className="flex flex-col">
          <div className="flex justify-between items-center py-2">
            <span>Last value:</span>
            <span>Type: -</span>
          </div>
          <div className="bg-[#1e1e1e] p-2 border border-neutral-700 rounded">
            <div className="min-h-[60px] flex items-center justify-center">
              <div className="text-sm text-neutral-400">No values received</div>
            </div>
          </div>
          <div className="p-2 text-xs flex flex-row justify-between items-center font-semibold">
            <span className="font-semibold">Last: -</span>
            <span className="font-semibold">Total: 0</span>
            <div
              className="cursor-default opacity-50"
              title="No data to inspect"
            >
              {indication}
            </div>
          </div>
        </div>
      );
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
      <div className="flex flex-col">
        <div className="flex justify-between items-center py-2">
          <span>Last value:</span>
          <span>Type: {valueType}</span>
        </div>
        <div className="bg-[#1e1e1e] p-2 border border-neutral-700 rounded">
          <pre className={cn(
            "m-0 whitespace-pre-wrap break-words font-mono text-xs overflow-auto min-h-[60px]",
            isExpanded ? "max-h-[300px]" : "max-h-[60px]"
          )}>
            {formattedValue}
          </pre>
        </div>
        <div className="p-2 text-xs flex flex-row justify-between items-center font-semibold">
          <span className="font-semibold">Last: {formatTimeAgo(lastTime ?? 0)}</span>
          <span className="font-semibold">Total: {lastSamples.length}</span>
          <div
            onClick={onInspect}
            className="cursor-pointer hover:opacity-80"
            title="Inspect all values"
          >
            {indication}
          </div>
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
      <div className="bg-[#383838] border-b border-neutral-700 py-[2px] px-2 rounded-t-md flex justify-between items-center">
        <div>
          <strong className="mr-1.5 text-sm font-bold">{displayName}</strong>{" "}
          <span className="text-[10px] capitalize">{type}</span>
        </div>
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="text-xs text-neutral-400 hover:text-white p-1 rounded"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
          </button>
        )}
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
