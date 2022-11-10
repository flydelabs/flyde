import {
  DebuggerValue,
  ProcessingChangeData,
  Project,
  CustomPart,
  InputsStateChangeData,
  PartError,
  PinType,
  debugLogger,
} from "@flyde/core";

import axios from "axios";

import io from "socket.io-client";
import { RemoteDebuggerCallback, RemoteDebuggerCancelFn, enumToArray, EventType } from "../common";

import { deserializeError, serializeError } from "serialize-error";
import { HistoryPayload, RuntimeEvents, RuntimeEventType } from "..";

const debug = debugLogger("runtime-editor-client");

export type GetPinHistoryDto = {
  id?: string;
};

export type GetHistoryDto = {
  id?: string;
  types?: RuntimeEventType[];
  limit?: number;
};

export type EditorDebuggerClient = {
  emitChange: (data: { project: Project }) => void;
  emitBreakpointsChange: (insIdsAndPins: string[]) => void;
  onInputValueChange: (cb: RemoteDebuggerCallback<DebuggerValue[]>) => RemoteDebuggerCancelFn;
  onOutputValueChange: (cb: RemoteDebuggerCallback<DebuggerValue[]>) => RemoteDebuggerCancelFn;
  onProcessingChange: (cb: RemoteDebuggerCallback<ProcessingChangeData>) => RemoteDebuggerCancelFn;
  onInputsStateChange: (
    cb: RemoteDebuggerCallback<InputsStateChangeData>
  ) => RemoteDebuggerCancelFn;
  onPartError: (cb: RemoteDebuggerCallback<PartError>) => RemoteDebuggerCancelFn;

  onBatchedEvents: (cb: RemoteDebuggerCallback<RuntimeEvents>) => RemoteDebuggerCancelFn;

  onRuntimeReady: (cb: RemoteDebuggerCallback<void>) => RemoteDebuggerCancelFn;
  interceptInput: (value: DebuggerValue) => void;
  interceptOutput: (value: DebuggerValue) => void;
  onChangeAwk: (cb: RemoteDebuggerCallback<{ hash: string }>) => RemoteDebuggerCancelFn;
  onChangeError: (cb: (error: any) => void) => RemoteDebuggerCancelFn;
  onIsAlive: (cb: RemoteDebuggerCallback<{ time: number }>) => RemoteDebuggerCancelFn;

  emitInputValue: (pinId: string, value: any) => void;

  destroy: () => void;
  onDisconnect: (cb: () => void) => void;
  debugInfo(): string;
  requestState: () => Promise<any>;

  getHistory: (dto: GetHistoryDto) => Promise<HistoryPayload>;
  clearHistory: () => Promise<void>;

  triggerPart: (partId: string, inputs: Record<string, any>) => void;
};

export const createEditorClient = (url: string, deploymentId: string): EditorDebuggerClient => {
  const urlParts = new URL(url);

  const socket = io(urlParts.origin, {
    path: `${urlParts.pathname === "/" ? "" : urlParts.pathname}/socket.io/editor`,
  });

  socket.emit("join-room-editor", deploymentId);

  return {
    emitChange: (data) => {
      socket.emit(EventType.CHANGE_EVENT_NAME, data);
    },
    emitBreakpointsChange: (data) => {
      socket.emit(EventType.UPDATE_BREAKPOINTS, data);
    },
    onInputValueChange: (cb) => {
      socket.on(EventType.INPUT_VALUE_CHANGE, cb);
      return () => socket.off(EventType.INPUT_VALUE_CHANGE, cb);
    },
    interceptInput: (data: DebuggerValue) => {
      socket.emit(EventType.INPUT_VALUE_OVERRIDE, data);
    },
    onOutputValueChange: (cb) => {
      socket.on(EventType.OUTPUT_VALUE_CHANGE, cb);
      return () => socket.off(EventType.OUTPUT_VALUE_CHANGE, cb);
    },
    interceptOutput: (data: DebuggerValue) => {
      socket.emit(EventType.OUTPUT_VALUE_OVERRIDE, data);
    },
    onRuntimeReady: (cb) => {
      socket.on(EventType.RUNTIME_READY, cb);
      return () => socket.off(EventType.RUNTIME_READY, cb);
    },
    onChangeAwk: (cb) => {
      socket.on(EventType.CHANGE_AWK, cb);
      return () => socket.off(EventType.CHANGE_AWK, cb);
    },
    onChangeError: (cb) => {
      socket.on(EventType.CHANGE_ERROR, cb);
      return () => socket.off(EventType.CHANGE_ERROR, cb);
    },
    onIsAlive: (cb) => {
      socket.on(EventType.IS_ALIVE, cb);
      return () => socket.off(EventType.IS_ALIVE, cb);
    },
    emitInputValue: (pinId, value) => {
      debug(`Emitting push input value to ${pinId} %o`, value);
      socket.emit(EventType.PUSH_INPUT_VALUE, { pinId, value });
    },
    destroy: () => {
      socket.disconnect();

      enumToArray(EventType).forEach((type) => socket.off(type));
    },
    onDisconnect: (cb) => {
      socket.on("disconnect", cb);
      return () => socket.off("disconnect", cb);
    },
    debugInfo: () => {
      return `Remote debugger for ${url}`;
    },
    onProcessingChange: (cb) => {
      socket.on(EventType.PROCESSING_CHANGE, cb);
      return () => socket.off(EventType.PROCESSING_CHANGE, cb);
    },
    onInputsStateChange: (cb) => {
      socket.on(EventType.INPUTS_STATE_CHANGE, cb);
      return () => socket.off(EventType.INPUTS_STATE_CHANGE, cb);
    },
    onPartError: (cb) => {
      socket.on(EventType.PART_ERROR, (data) => {
        const deserializedError = deserializeError(data.error);
        cb({ ...data, error: deserializedError });
      });
      return () => socket.off(EventType.PART_ERROR, cb);
    },
    onBatchedEvents: (cb) => {
      socket.on(EventType.EVENTS_BATCH, cb);
      return () => socket.off(EventType.EVENTS_BATCH, cb);
    },
    requestState: () => {
      return axios.get(`${url}/state`).then((r) => r.data.state);
    },
    getHistory: (dto) => {
      return axios
        .get(`${url}/history`, {
          params: {
            id: dto.id,
            types: dto.types,
            limit: dto.limit,
          },
        })
        .then((r) => r.data);
    },
    clearHistory: () => {
      return axios.delete(`${url}/history`).then(() => {});
    },
    triggerPart: (partId, inputs) => {
      return axios.post(`${url}/trigger`, { partId, inputs }).then((r) => r.data);
    },
  };
};
