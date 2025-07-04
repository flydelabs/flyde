import { DebuggerEvent } from "../execute/debugger/events";

export type RemoteDebuggerCallback<T> = (data: T) => void;
export type RemoteDebuggerCancelFn = () => void;

export enum DebuggerServerEventType {
  RUNTIME_READY = "runtime-ready",
  CHANGE_EVENT_NAME = "change",
  PUSH_INPUT_VALUE = "push-input-value",
  CHANGE_AWK = "live-change-awk",
  CHANGE_ERROR = "live-change-error",

  IS_ALIVE = "is-alive",

  UPDATE_BREAKPOINTS = "update-breakpoints",

  INPUT_VALUE_OVERRIDE = "input-value-override",
  OUTPUT_VALUE_OVERRIDE = "output-value-override",

  INPUT_VALUE_CHANGE = "input-value-changed",
  OUTPUT_VALUE_CHANGE = "output-value-changed",

  PROCESSING_CHANGE = "processing-changed",
  INPUTS_STATE_CHANGE = "inputs-state-changed",
  NODE_ERROR = "node-error",

  EVENTS_BATCH = "events-batch",
}

export type HistoryPayload = {
  total: number;
  lastSamples: DebuggerEvent[];
};