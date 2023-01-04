import { Project, PartError, debugLogger, DebuggerEvent } from "@flyde/core";

import axios from "axios";

import io from "socket.io-client";
import {
  RemoteDebuggerCallback,
  RemoteDebuggerCancelFn,
  enumToArray,
  DebuggerServerEventType,
} from "../common";

import { deserializeError } from "serialize-error";
import { HistoryPayload } from "..";

const debug = debugLogger("runtime-editor-client");

export type GetPinHistoryDto = {
  id?: string;
};

export type GetHistoryDto = {
  pinId: string;
  insId: string;
  limit?: number;
};

export type EditorDebuggerClient = {
  emitChange: (data: { project: Project }) => void;
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

  triggerPart: (partId: string, inputs: Record<string, any>) => void;
};

export const createEditorClient = (
  url: string,
  deploymentId: string
): EditorDebuggerClient => {
  const urlParts = new URL(url);

  const socket = io(urlParts.origin, {
    path: `${
      urlParts.pathname === "/" ? "" : urlParts.pathname
    }/socket.io/editor`,
  });

  socket.emit("join-room-editor", deploymentId);

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
      return axios.get(`${url}/state`).then((r) => r.data.state);
    },
    getHistory: (dto) => {
      return axios
        .get(`${url}/history`, {
          params: {
            insId: dto.insId,
            pinId: dto.pinId,
            limit: dto.limit,
          },
        })
        .then((r) => r.data);
    },
    clearHistory: () => {
      return axios.delete(`${url}/history`).then(() => {});
    },
    triggerPart: (partId, inputs) => {
      return axios
        .post(`${url}/trigger`, { partId, inputs })
        .then((r) => r.data);
    },
  };
};
