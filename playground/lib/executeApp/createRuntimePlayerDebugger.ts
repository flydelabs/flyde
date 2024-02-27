import { RuntimePlayer } from "@flyde/flow-editor";
import { Debugger, DebuggerEvent, DebuggerEventType } from "@flyde/core";
import { HistoryPlayer } from "./createHistoryPlayer";
import { EditorDebuggerClient } from "@flyde/remote-debugger";

export const createRuntimeClientDebugger = (
  runtimePlayer: RuntimePlayer,
  historyPlayer: HistoryPlayer
  // onEvent: (e: DebuggerEvent) => void
): Debugger & Pick<EditorDebuggerClient, "onBatchedEvents"> => {
  const listeners = new Set<(events: DebuggerEvent[]) => void>();

  return {
    onEvent: (e) => {
      const fullEvent = {
        ...e,
        time: Date.now(),
        executionId: "n/a",
      } as DebuggerEvent;

      // onEvent(fullEvent);
      historyPlayer.addEvents([fullEvent]);
      runtimePlayer.addEvents([fullEvent]);

      listeners.forEach((cb) => cb([fullEvent]));
    },
    onBatchedEvents: (cb: (events: DebuggerEvent[]) => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
};
