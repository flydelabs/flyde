import React, { ReactElement, useCallback, useRef, useState } from "react";
import { useDebuggerContext } from "../../flow-editor/DebuggerContext";
import { TRIGGER_PIN_ID, ERROR_PIN_ID, HistoryPayload } from "@flyde/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

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
    onRequestHistory(instanceId, pinId ?? "", type ?? "input").then((val) => {
      setHistory(val);
    });
    historyTimer.current = setInterval(() => {
      onRequestHistory(instanceId, pinId ?? "", type ?? "input").then((val) => {
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


export const getInputName = (pinId: string): string => {
  switch (pinId) {
    case TRIGGER_PIN_ID:
      return 'trigger';
    default:
      return pinId;
  }
};

export const getOutputName = (pinId: string) => {
  switch (pinId) {
    case ERROR_PIN_ID:
      return "error";
    default:
      return pinId;
  }
};
