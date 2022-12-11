import { PinType } from "@flyde/core";
import { HistoryPayload, valuePreview } from "@flyde/remote-debugger";
import React from "react";
import { useCallback, useRef, useState } from "react";
import { PinViewProps } from ".";

export const calcHistoryContent = (history?: HistoryPayload) => {
    if (history) {
      const { total, lastSamples } = history;

      const timesActivated = `<strong>Activated ${total} times this session</strong>`;
      const lastValueData =  lastSamples.length > 0
        ? `<div>Last value: <strong>${valuePreview(lastSamples[0].val).substr(
            0,
            200
          )}</strong></div>`
        : "";
      return `${timesActivated } ${lastValueData}`
    } else {
      return 'Loading session data..'
    }
}

const INSIGHTS_TOOLTIP_INTERVAL = 500;

export const useHistoryHelpers = (onRequestHistory: PinViewProps['onRequestHistory'], id: string, type: PinType) => {
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

      return {history, refreshHistory, resetHistory};
}