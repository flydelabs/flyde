import {
  debugLogger,
  DebuggerEvent,
  PinType,
  RemoteDebuggerCallback,
  RemoteDebuggerCancelFn,
  enumToArray,
  DebuggerServerEventType,
  HistoryPayload
} from "@flyde/core";

import { default as axios } from "axios";

import { io as _io } from "socket.io-client";

const debug = debugLogger("remote-debugger:editor-client");

export type GetPinHistoryDto = {
  id?: string;
};

export type GetHistoryDto = {
  pinId?: string;
  type?: PinType;
  insId: string;
  limit?: number;
  executionId: string;
};

export type EditorDebuggerClient = {
  emitChange: (data: {}) => void;
  emitBreakpointsChange: (insIdsAndPins: string[]) => void;

  onBatchedEvents: (
    cb: RemoteDebuggerCallback<DebuggerEvent[]>
  ) => RemoteDebuggerCancelFn;

  onRuntimeReady: (cb: RemoteDebuggerCallback<void>) => RemoteDebuggerCancelFn;
  interceptInput: (value: DebuggerEvent) => void;
  interceptOutput: (value: DebuggerEvent) => void;
  onChangeAwk: (
    cb: RemoteDebuggerCallback<{ hash: string }>
  ) => RemoteDebuggerCancelFn;
  onChangeError: (cb: (error: any) => void) => RemoteDebuggerCancelFn;
  onIsAlive: (
    cb: RemoteDebuggerCallback<{ time: number }>
  ) => RemoteDebuggerCancelFn;

  emitInputValue: (pinId: string, value: any) => void;

  destroy: () => void;
  onDisconnect: (cb: () => void) => void;
  debugInfo(): string;
  requestState: () => Promise<any>;

  getHistory: (dto: GetHistoryDto) => Promise<HistoryPayload>;
  clearHistory: () => Promise<void>;

  triggerNode: (nodeId: string, inputs: Record<string, any>) => void;
};

export const createEditorClient = (
  url: string,
  executionId: string
): EditorDebuggerClient => {
  const urlNodes = new URL(url);

  const socket = _io(urlNodes.origin, {
    path: `${urlNodes.pathname === "/" ? "" : urlNodes.pathname
      }/socket.io/editor`,
    timeout: 30000,
  });

  socket.emit("join-room-editor", executionId);

  return {
    emitChange: (data) => {
      socket.emit(DebuggerServerEventType.CHANGE_EVENT_NAME, data);
    },
    emitBreakpointsChange: (data) => {
      socket.emit(DebuggerServerEventType.UPDATE_BREAKPOINTS, data);
    },
    interceptInput: (data: DebuggerEvent) => {
      socket.emit(DebuggerServerEventType.INPUT_VALUE_OVERRIDE, data);
    },
    interceptOutput: (data: DebuggerEvent) => {
      socket.emit(DebuggerServerEventType.OUTPUT_VALUE_OVERRIDE, data);
    },
    onRuntimeReady: (cb) => {
      socket.on(DebuggerServerEventType.RUNTIME_READY, cb);
      return () => socket.off(DebuggerServerEventType.RUNTIME_READY, cb);
    },
    onChangeAwk: (cb) => {
      socket.on(DebuggerServerEventType.CHANGE_AWK, cb);
      return () => socket.off(DebuggerServerEventType.CHANGE_AWK, cb);
    },
    onChangeError: (cb) => {
      socket.on(DebuggerServerEventType.CHANGE_ERROR, cb);
      return () => socket.off(DebuggerServerEventType.CHANGE_ERROR, cb);
    },
    onIsAlive: (cb) => {
      socket.on(DebuggerServerEventType.IS_ALIVE, cb);
      return () => socket.off(DebuggerServerEventType.IS_ALIVE, cb);
    },
    emitInputValue: (pinId, value) => {
      debug(`Emitting push input value to ${pinId} %o`, value);
      socket.emit(DebuggerServerEventType.PUSH_INPUT_VALUE, { pinId, value });
    },
    destroy: () => {
      socket.disconnect();

      enumToArray(DebuggerServerEventType).forEach((type) => socket.off(type));
    },
    onDisconnect: (cb) => {
      socket.on("disconnect", cb);
      return () => socket.off("disconnect", cb);
    },
    debugInfo: () => {
      return `Remote debugger for ${url}`;
    },
    onBatchedEvents: (cb) => {
      socket.on(DebuggerServerEventType.EVENTS_BATCH, cb);
      return () => socket.off(DebuggerServerEventType.EVENTS_BATCH, cb);
    },
    requestState: () => {
      return axios.get(`${url}/state`).then((r: any) => r.data.state);
    },
    getHistory: (dto) => {
      return axios
        .get(`${url}/history`, {
          params: {
            insId: dto.insId,
            pinId: dto.pinId,
            limit: dto.limit,
            executionId,
          },
        })
        .then((r: any) => r.data);
    },
    clearHistory: () => {
      return axios.delete(`${url}/history`).then(() => { });
    },
    triggerNode: (nodeId, inputs) => {
      return axios
        .post(`${url}/trigger`, { nodeId, inputs })
        .then((r: any) => r.data);
    },
  };
};