import { RuntimePlayer } from "@flyde/flow-editor";
import { Debugger, TRIGGER_PIN_ID } from "@flyde/core";
import { RuntimeEventType } from "@flyde/remote-debugger";
import { HistoryPlayer } from "./createHistoryPlayer";

export const createRuntimeClientDebugger = (runtimePlayer: RuntimePlayer, historyPlayer: HistoryPlayer): Debugger => {
  return {
    onInput: (e) => {
      const events = [{
          type: RuntimeEventType.INPUT_CHANGE,
          t: e.time,
          id: `${e.insId}.${e.pinId}.input`,
          dt: 0,
          val: e.val,
      }];
      runtimePlayer.addEvents(events);
      historyPlayer.addEvents(events);
    },
    onOutput: (e) => {
      const events = [
        {
          type: RuntimeEventType.OUTPUT_CHANGE,
          t: e.time,
          id: `${e.insId}.${e.pinId}.output`,
          dt: 0,
          val: e.val,
        }
      ];
      historyPlayer.addEvents(events);
      runtimePlayer.addEvents(events);
    },
    onInputsStateChange: (e) => {
      runtimePlayer.addEvents([
        {
          type: RuntimeEventType.INPUTS_STATE_CHANGE,
          t: Date.now(),
          id: `${e.insId}`,
          dt: 0,
          val: e.inputs,
        },
      ]);
    },
    onProcessing: (e) => {
      runtimePlayer.addEvents([
        {
          type: RuntimeEventType.PROCESSING_CHANGE,
          t: Date.now(),
          id: `${e.insId}`,
          dt: 0,
          val: e.processing,
        },
      ]);
    },
    onError: (e) => {
      runtimePlayer.addEvents([
        {
          type: RuntimeEventType.ERROR,
          t: Date.now(),
          id: `${e.insId}`,
          dt: 0,
          val: e.message
        },
      ]);

      runtimePlayer.addEvents([
        {
          type: RuntimeEventType.OUTPUT_CHANGE,
          t: Date.now(),
          id: `${e.insId}.${TRIGGER_PIN_ID}.output`,
          dt: 0,
          val: e.message
        },
      ]);
    }
  };
};
