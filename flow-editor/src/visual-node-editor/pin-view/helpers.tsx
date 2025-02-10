import { HistoryPayload } from "@flyde/remote-debugger";
import React, { useCallback, useRef, useState } from "react";
import { useDebuggerContext } from "../../flow-editor/DebuggerContext";

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
