import { RuntimePlayer } from "@flyde/flow-editor";
import { Debugger, DebuggerEvent } from "@flyde/core";
import { HistoryPlayer } from "./createHistoryPlayer";
import { EditorDebuggerClient } from "@site/../remote-debugger/dist";

export const createRuntimeClientDebugger = (
  runtimePlayer: RuntimePlayer,
  historyPlayer: HistoryPlayer
): Debugger & Pick<EditorDebuggerClient, "onBatchedEvents"> => {
  const listeners = new Set<(events: DebuggerEvent[]) => void>();

  return {
    onEvent: (e) => {
      const fullEvent = {
        ...e,
        time: Date.now(),
        executionId: "n/a",
      } as DebuggerEvent;
      console.info(`Got debugger event`, e);
      historyPlayer.addEvents([fullEvent]);
      runtimePlayer.addEvents([fullEvent]);

      listeners.forEach((cb) => cb([fullEvent]));
    },
    onBatchedEvents: (cb: (events: DebuggerEvent[]) => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    destroy: () => {
      listeners.clear();
    },
  };
};
