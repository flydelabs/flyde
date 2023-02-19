import { HistoryPayload, valuePreview } from "@flyde/remote-debugger";
import React from "react";
import { useCallback, useRef, useState } from "react";
import { PinViewProps } from ".";

export const calcHistoryContent = (history?: HistoryPayload, queuedValues?: number) => {
  if (history) {
    const { total, lastSamples } = history;

    const timesActivated = `<strong>Activated ${total} times this session</strong>`;
    const lastValueData =
      lastSamples.length > 0
        ? `<div>Last value: <strong>${valuePreview(lastSamples[0].val).substring(
            0,
            200
          )}</strong></div><em>Inspect instance for the full value</em>`
        : "";
    const queuedValuesData = queuedValues ? `<hr/><div>Queued values: <strong>${queuedValues}</strong></div>` : "";
    return `${timesActivated} ${lastValueData}${queuedValuesData}`;
  } else {
    return "Loading session data..";
  }
};

const INSIGHTS_TOOLTIP_INTERVAL = 500;

export const useHistoryHelpers = (
  onRequestHistory: PinViewProps["onRequestHistory"],
  id: string,
  type: 'input' | 'output'
) => {
  const historyTimer = useRef<any>();

  const [history, setHistory] = useState<HistoryPayload>();

  const refreshHistory = useCallback(() => {
    clearInterval(historyTimer.current);
    onRequestHistory(id, type).then((val) => {
      setHistory(val);
    });
    historyTimer.current = setInterval(() => {
      onRequestHistory(id, type).then((val) => {
        setHistory(val);
      });
    }, INSIGHTS_TOOLTIP_INTERVAL);
  }, [onRequestHistory, id, type]);

  const resetHistory = React.useCallback(() => {
    clearInterval(historyTimer.current);
    setHistory(undefined);
  }, []);

  return { history, refreshHistory, resetHistory };
};
