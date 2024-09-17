import { HistoryPayload, valuePreview } from "@flyde/remote-debugger";
import React from "react";
import { useCallback, useRef, useState } from "react";
import { useDebuggerContext } from "../../flow-editor/DebuggerContext";

export const calcHistoryContent = (
  history?: HistoryPayload,
  queuedValues?: number
) => {
  if (history) {
    const { total, lastSamples } = history;

    const timesActivated = (
      <strong>Activated {total} times this session</strong>
    );

    const lastValueData =
      lastSamples.length > 0 ? (
        <div>
          Last value:{" "}
          <strong>{valuePreview(lastSamples[0].val).substring(0, 200)}</strong>
          <br />
          <em>Inspect instance for the full value</em>
        </div>
      ) : (
        ""
      );
    const queuedValuesData = queuedValues ? (
      <React.Fragment>
        <div>
          Queued values: <strong>{queuedValues}</strong>
        </div>
      </React.Fragment>
    ) : (
      ""
    );
    return (
      <div className="history-tooltip">
        {timesActivated}
        {lastValueData}
        {queuedValuesData}
      </div>
    );
  } else {
    return "Loading session data..";
  }
};

const INSIGHTS_TOOLTIP_INTERVAL = 500;

export const useHistoryHelpers = (
  instanceId: string,
  pinId?: string,
  type?: "input" | "output"
) => {
  const historyTimer = useRef<any>();

  const { onRequestHistory } = useDebuggerContext();

  const [history, setHistory] = useState<HistoryPayload>();

  const refreshHistory = useCallback(() => {
    clearInterval(historyTimer.current);
    onRequestHistory(instanceId, pinId, type).then((val) => {
      setHistory(val);
    });
    historyTimer.current = setInterval(() => {
      onRequestHistory(instanceId, pinId, type).then((val) => {
        setHistory(val);
      });
    }, INSIGHTS_TOOLTIP_INTERVAL);
  }, [instanceId, onRequestHistory, pinId, type]);

  const resetHistory = React.useCallback(() => {
    clearInterval(historyTimer.current);
    setHistory(undefined);
  }, []);

  return { history, refreshHistory, resetHistory };
};
