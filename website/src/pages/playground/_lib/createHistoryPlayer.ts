import { RuntimePlayer } from "@flyde/flow-editor";
import { Debugger, DebuggerEvent, DebuggerEventType, ERROR_PIN_ID, PinDebuggerEvent, PinType } from "@flyde/core";
import { HistoryPayload } from "@site/../remote-debugger/dist";

const MAX_EVENTS_HISTORY_LIMIT = 200;

type DebugHistoryMap = Map<string, { total: number; lastSamples: DebuggerEvent[] }>;

export type HistoryPlayer = {
  addEvents: (events: DebuggerEvent[]) => void;
  requestHistory: (insId: string, pinId: string, type: PinType) => Promise<HistoryPayload>;
}

export const createHistoryPlayer = (): HistoryPlayer => {

  const historyMap: DebugHistoryMap = new Map();
  
  return {
    requestHistory: async (insId: string, pinId: string, pinType: PinType) => {
      const type = pinType === 'input' ? DebuggerEventType.INPUT_CHANGE : DebuggerEventType.OUTPUT_CHANGE;
      console.log({insId, pinId, type});
      
      const id = `${insId}.${pinId}.${type}`;
      const payload: HistoryPayload = historyMap.get(id) || { total: 0, lastSamples: [] };
      const samples = payload.lastSamples.slice(0, MAX_EVENTS_HISTORY_LIMIT);
      return { ...payload, lastSamples: samples };
    },
    addEvents: (events) => {
      events.forEach((event) => {

        // hack for easily logging errors to error pin
        if (event.type === DebuggerEventType.ERROR) {
          const ev: PinDebuggerEvent<DebuggerEventType.OUTPUT_CHANGE> = event as any;
          ev.type = DebuggerEventType.OUTPUT_CHANGE;
          ev.pinId = ERROR_PIN_ID;
        }

        if (event.type === DebuggerEventType.INPUT_CHANGE || event.type === DebuggerEventType.OUTPUT_CHANGE) {
          const {insId, type, pinId} = event;
          const id = `${insId}.${pinId}.${type}`;
          const curr = historyMap.get(id) || { total: 0, lastSamples: [] };
          curr.lastSamples.unshift(event);
          if (curr.lastSamples.length > MAX_EVENTS_HISTORY_LIMIT) {
            curr.lastSamples.splice(MAX_EVENTS_HISTORY_LIMIT, curr.lastSamples.length - MAX_EVENTS_HISTORY_LIMIT);
          }
          curr.total++;
          historyMap.set(id, curr);
        }
      });
    }
  };
};
