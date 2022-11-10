import { RuntimePlayer } from "@flyde/flow-editor";
import { Debugger, PinType } from "@flyde/core";
import { RuntimeEvent } from "@site/../managed-version/remote-debugger/dist";
import { HistoryPayload } from "@site/../managed-version/remote-debugger/dist";
import { RuntimeEvents } from "@site/../managed-version/remote-debugger/dist";

const MAX_EVENTS_HISTORY_LIMIT = 200;

type DebugHistoryMap = Map<string, { total: number; lastSamples: RuntimeEvent[] }>;

export type HistoryPlayer = {
  addEvents: (events: RuntimeEvents) => void;
  requestHistory: (insId: string, pinId: string, type: PinType) => Promise<HistoryPayload>;
}

export const createHistoryPlayer = (): HistoryPlayer => {

  const historyMap: DebugHistoryMap = new Map();
  
  return {
    requestHistory: async (insId: string, pinId: string, type: PinType) => {
      const id = `${insId}.${pinId}.${type}`;
      const payload: HistoryPayload = historyMap.get(id) || { total: 0, lastSamples: [] };
      const samples = payload.lastSamples.slice(0, MAX_EVENTS_HISTORY_LIMIT);
      return { ...payload, lastSamples: samples };
    },
    addEvents: (events) => {
      events.forEach((event) => {
        const curr = historyMap.get(event.id) || { total: 0, lastSamples: [] };
        curr.lastSamples.unshift(event);
        if (curr.lastSamples.length > MAX_EVENTS_HISTORY_LIMIT) {
          curr.lastSamples.splice(MAX_EVENTS_HISTORY_LIMIT, curr.lastSamples.length - MAX_EVENTS_HISTORY_LIMIT);
        }
        curr.total++;
        historyMap.set(event.id, curr);
      });
    }
  };
};
