import {
  DebuggerEvent,
  DebuggerEventType,
  ERROR_PIN_ID,
  PinDebuggerEvent,
  PinType,
} from "@flyde/core";
import { HistoryPayload } from "@flyde/remote-debugger";

const MAX_EVENTS_HISTORY_LIMIT = 200;

type DebugHistoryMap = Map<
  string,
  { total: number; lastSamples: DebuggerEvent[] }
>;

export type HistoryPlayer = {
  addEvents: (events: DebuggerEvent[]) => void;
  requestHistory: (
    insId: string,
    pinId: string,
    type: PinType
  ) => Promise<HistoryPayload>;
};

export const createHistoryPlayer = (): HistoryPlayer => {
  const pinHistoryMap: DebugHistoryMap = new Map();
  const insHistoryMap: DebugHistoryMap = new Map();

  return {
    requestHistory: async (insId: string, pinId: string, pinType: PinType) => {
      const type =
        pinType === "input"
          ? DebuggerEventType.INPUT_CHANGE
          : DebuggerEventType.OUTPUT_CHANGE;

      if (pinId) {
        const id = `${insId}.${pinId}.${type}`;
        const payload: HistoryPayload = pinHistoryMap.get(id) || {
          total: 0,
          lastSamples: [],
        };
        const samples = payload.lastSamples.slice(0, MAX_EVENTS_HISTORY_LIMIT);
        return { ...payload, lastSamples: samples };
      } else {
        const payload: HistoryPayload = insHistoryMap.get(insId) || {
          total: 0,
          lastSamples: [],
        };
        const samples = payload.lastSamples.slice(0, MAX_EVENTS_HISTORY_LIMIT);
        return { ...payload, lastSamples: samples };
      }
    },
    addEvents: (events) => {
      events.forEach((_event) => {
        // copy for the hack below not to mutate the original event
        const event = { ..._event };
        if (event.type === DebuggerEventType.ERROR) {
          const ev: PinDebuggerEvent<DebuggerEventType.OUTPUT_CHANGE> =
            event as any;
          ev.type = DebuggerEventType.OUTPUT_CHANGE;
          ev.pinId = ERROR_PIN_ID;
        }

        if (
          event.type === DebuggerEventType.INPUT_CHANGE ||
          event.type === DebuggerEventType.OUTPUT_CHANGE
        ) {
          const { insId, type, pinId } = event;
          {
            const id = `${insId}.${pinId}.${type}`;
            const curr = pinHistoryMap.get(id) || { total: 0, lastSamples: [] };
            curr.lastSamples.unshift(event);
            if (curr.lastSamples.length > MAX_EVENTS_HISTORY_LIMIT) {
              curr.lastSamples.splice(
                MAX_EVENTS_HISTORY_LIMIT,
                curr.lastSamples.length - MAX_EVENTS_HISTORY_LIMIT
              );
            }
            curr.total++;
            pinHistoryMap.set(id, curr);
          }

          {
            const curr = insHistoryMap.get(insId) || {
              total: 0,
              lastSamples: [],
            };
            curr.lastSamples.unshift(event);
            if (curr.lastSamples.length > MAX_EVENTS_HISTORY_LIMIT) {
              curr.lastSamples.splice(
                MAX_EVENTS_HISTORY_LIMIT,
                curr.lastSamples.length - MAX_EVENTS_HISTORY_LIMIT
              );
            }
            curr.total++;
            pinHistoryMap.set(insId, curr);
          }
        }
      });
    },
  };
};
