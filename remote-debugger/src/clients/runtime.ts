import {
  DebuggerCommand,
  PartError,
  debugLogger,
  cappedArrayDebounce,
  DebuggerEvent,
} from "@flyde/core";

import { serializeError } from "serialize-error";
import { io } from "socket.io-client";
import {
  RemoteDebuggerCallback,
  RemoteDebuggerCancelFn,
  enumToArray,
  DebuggerServerEventType,
  toString,
} from "../common";

const debug = debugLogger("debugger-runtime-client");

export type RuntimeDebuggerClient = {
  onChange: (
    cb: RemoteDebuggerCallback<{ }>
  ) => RemoteDebuggerCancelFn;
  onInput: (
    cb: RemoteDebuggerCallback<{ pinId: string; value: any }>
  ) => RemoteDebuggerCancelFn;

  emitEvent: (event: Omit<DebuggerEvent, 'time'>) => DebuggerCommand;

  emitChangeAwk: () => void;
  emitChangeError: (error: Error) => void;
  emitRuntimeReady: () => void;
  // emitIsAlive: ({time: number, hash: string}) => void;
  emitIsAlive: (bob: { time: number; hash: string } | number) => void;

  destroy: () => void;
  onDisconnect: (cb: () => void) => void;
};

export const DEFAULT_DT_SCALE = 1;

export const createRuntimeClient = (
  url: string,
  deploymentId: string
): Promise<RuntimeDebuggerClient> => {
  const urlParts = new URL(url);
  const socket = io(urlParts.origin, {
    path: `${
      urlParts.pathname === "/" ? "" : urlParts.pathname
    }/socket.io/runtime`,
    parser: require('../custom-parser')
  });

  socket.emit("join-room-runtime", deploymentId);

  let breakpoints = new Set<string>();

  socket.on(DebuggerServerEventType.UPDATE_BREAKPOINTS, (data: string[]) => {
    breakpoints = new Set(data);
  });

  const EMIT_DEBOUNCE_TIMEOUT = 100;
  const EMIT_DEBOUNCE_LIMIT = 200;

  const debouncedSendBatchedEvent = cappedArrayDebounce<DebuggerEvent>(
    (events) => {
      debug(`Emitting debounced batched events - ${events.length}`);
      socket.emit(DebuggerServerEventType.EVENTS_BATCH, events);
    },
    EMIT_DEBOUNCE_TIMEOUT,
    EMIT_DEBOUNCE_LIMIT
  );

  const client: RuntimeDebuggerClient = {
    onChange: (cb) => {
      socket.on(DebuggerServerEventType.CHANGE_EVENT_NAME, cb);

      return () => socket.off(DebuggerServerEventType.CHANGE_EVENT_NAME, cb);
    },
    onInput: (cb) => {
      socket.on(DebuggerServerEventType.PUSH_INPUT_VALUE, cb);

      return () => socket.off(DebuggerServerEventType.PUSH_INPUT_VALUE, cb);
    },
    emitEvent: (event: DebuggerEvent) => {
      debug(`Emitting event ${event.type} change event of ${event.insId}`);

      if (typeof event.val === 'object') {
        // hack to avoid toJSON overrides (i.e. in discord bot)
        event.val = {...event.val};
      }


      debouncedSendBatchedEvent.addItem({...event, time: Date.now()});
    },
    emitRuntimeReady: () => {
      socket.emit(DebuggerServerEventType.RUNTIME_READY, {});
    },
    emitChangeAwk: () => {
      socket.emit(DebuggerServerEventType.CHANGE_AWK, {});
    },
    emitChangeError: (error: Error) => {
      socket.emit(DebuggerServerEventType.CHANGE_ERROR, { error });
    },
    emitIsAlive: (time) => {
      socket.emit(DebuggerServerEventType.IS_ALIVE, { time });
    },
    destroy: () => {
      debouncedSendBatchedEvent.flush();
      enumToArray(DebuggerServerEventType).forEach((type) => socket.off(type));
      socket.disconnect();
    },
    onDisconnect: (cb) => {
      socket.on("disconnect", cb);
      return () => socket.off("disconnect", cb);
    },
  };

  return new Promise((res, rej) => {
    if (socket.connected) {
      res(client);
    } else {
      socket.on("connect_error", (error: any) => {
        rej(`Socket connect error: ${error}`);
      });

      socket.on("connect", () => {
        res(client);
      });
    }
  });
};
