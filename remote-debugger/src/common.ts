/*
EVENTS NEED HANDLING IN SERVER AS WELL!
*/

import { OMap } from "@flyde/core";
import { serializeError } from "serialize-error";

const STRING_LIMIT = 250;
const PREVIEW_LIMIT = 100;

export const toString = (v: any) => {
  const type = typeof v;

  switch (type) {
    case "object":
      if (v instanceof Error) {
        return JSON.stringify(serializeError(v));
      }
      try {
        return JSON.stringify(v).substr(0, STRING_LIMIT);
      } catch (e) {
        return `Object (cannot stringify)`;
      }
    default:
      return `${v}`.substr(0, STRING_LIMIT);
  }
};

export const valuePreview = (v: any) => {
  return toString(v).substr(0, PREVIEW_LIMIT);
};

export const isSimpleType = (v: any) => {
  return ["number", "string", "boolean"].includes(typeof v);
};

export const isNumber = (v: any) => isNaN(Number(v)) === false;

export function enumToArray(aEnum: any) {
  return Object.keys(aEnum)
    .filter(isNumber)
    .map((key) => aEnum[key]);
}

export type RemoteDebuggerCallback<T> = (data: T) => void;
export type RemoteDebuggerCancelFn = () => void;

export enum EventType {
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
  PART_ERROR = "part-error",

  EVENTS_BATCH = "events-batch",
}

export enum RuntimeEventType {
  INPUT_CHANGE = "i",
  OUTPUT_CHANGE = "o",
  PROCESSING_CHANGE = "pc",
  ERROR = "err",
  INPUTS_STATE_CHANGE = "isc",
}

export const MAJOR_EVENT_TYPES: RuntimeEventType[] = [
  RuntimeEventType.INPUT_CHANGE,
  RuntimeEventType.OUTPUT_CHANGE,
  RuntimeEventType.ERROR,
];

export const MINOR_EVENT_TYPES: RuntimeEventType[] = [
  RuntimeEventType.PROCESSING_CHANGE,
  RuntimeEventType.INPUTS_STATE_CHANGE,
];

export type RuntimeEventTypeData = {
  [RuntimeEventType.INPUTS_STATE_CHANGE]: OMap<number>;
  [RuntimeEventType.PROCESSING_CHANGE]: boolean;
  [RuntimeEventType.ERROR]: any;
  [RuntimeEventType.INPUT_CHANGE]: string;
  [RuntimeEventType.OUTPUT_CHANGE]: string;
};

export type BaseRuntimeEvent<T extends RuntimeEventType> = {
  type: T;
  id: string;
  dt: number;
  val: RuntimeEventTypeData[T];
  t: number;
};

export type MajorRuntimeEvent =
  | BaseRuntimeEvent<RuntimeEventType.OUTPUT_CHANGE>
  | BaseRuntimeEvent<RuntimeEventType.INPUT_CHANGE>
  | BaseRuntimeEvent<RuntimeEventType.ERROR>;

export type MinorRuntimeEvent =
  | BaseRuntimeEvent<RuntimeEventType.INPUTS_STATE_CHANGE>
  | BaseRuntimeEvent<RuntimeEventType.PROCESSING_CHANGE>;

export type RuntimeEvent = MajorRuntimeEvent | MinorRuntimeEvent;

export type RuntimeEvents = Array<RuntimeEvent>;

export type HistoryPayload = {
  total: number;
  lastSamples: RuntimeEvents;
};
