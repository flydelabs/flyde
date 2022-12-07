import { RuntimePlayer } from "@flyde/flow-editor";
import { Debugger } from "@flyde/core";
import { HistoryPlayer } from "./createHistoryPlayer";

export const createRuntimeClientDebugger = (runtimePlayer: RuntimePlayer, historyPlayer: HistoryPlayer): Debugger => {
  return {
    onEvent: (e) => {
      console.info(`Got debugger event`, e);
      
      historyPlayer.addEvents([e]);
      runtimePlayer.addEvents([e]);
    }
  };
};
