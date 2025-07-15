import {
  DebuggerEvent,
  DebuggerEventType,
  ERROR_PIN_ID,
  PinDebuggerEvent,
  PinType,
  ROOT_INS_ID,
} from "@flyde/core";
import { HistoryPayload } from "@flyde/core";

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
  clear: () => void;
};

export const createHistoryPlayer = (): HistoryPlayer => {
  const pinHistoryMap: DebugHistoryMap = new Map();
  const insHistoryMap: DebugHistoryMap = new Map();

  return {
    requestHistory: async (insId: string, pinId: string, pinType: PinType) => {

      const _pintType = insId === ROOT_INS_ID ? pinType === "input" ? "output" : "input" : pinType;
      const type = _pintType === "input"
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
      events.forEach((event) => {
        // hack for easily logging errors to error pin
        if (event.type === DebuggerEventType.ERROR) {
          const ev: PinDebuggerEvent<DebuggerEventType.OUTPUT_CHANGE> =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    clear: () => {
      pinHistoryMap.clear();
      insHistoryMap.clear();
    },
  };
};