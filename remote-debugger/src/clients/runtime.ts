import {
  ERROR_PIN_ID,
  DebuggerCommand,
  DebuggerValue,
  GroupedPart,
  InputsStateChangeData,
  PartError,
  ProcessingChangeData,
  Project,
  debugLogger,
  cappedArrayDebounce,
  randomInt,
} from "@flyde/core";

import { serializeError } from "serialize-error";
import { io } from "socket.io-client";
import {
  RemoteDebuggerCallback,
  RemoteDebuggerCancelFn,
  enumToArray,
  EventType,
  isSimpleType,
  RuntimeEvent,
  RuntimeEventType,
  toString,
} from "../common";

const debug = debugLogger("debugger-runtime-client");

export type RuntimeDebuggerClient = {
  onChange: (cb: RemoteDebuggerCallback<{ project: Project }>) => RemoteDebuggerCancelFn;
  onInput: (cb: RemoteDebuggerCallback<{ pinId: string; value: any }>) => RemoteDebuggerCancelFn;

  emitInputChange: (value: DebuggerValue) => DebuggerCommand;
  emitOutputChange: (value: DebuggerValue) => DebuggerCommand;
  emitProcessing: (value: ProcessingChangeData) => void;
  emitInputsStateChange: (value: InputsStateChangeData) => void;
  emitPartError: (value: PartError) => void;

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
    path: `${urlParts.pathname === "/" ? "" : urlParts.pathname}/socket.io/runtime`,
  });

  socket.emit("join-room-runtime", deploymentId);

  let breakpoints = new Set<string>();

  socket.on(EventType.UPDATE_BREAKPOINTS, (data: string[]) => {
    breakpoints = new Set(data);
  });

  const EMIT_DEBOUNCE_TIMEOUT = 100;
  const EMIT_DEBOUNCE_LIMIT = 200;

  const start = Date.now();

  const dt = () => {
    const d = Date.now() - start;
    return Math.round(d / DEFAULT_DT_SCALE);
  };

  const debouncedSendBatchedEvent = cappedArrayDebounce<RuntimeEvent>(
    (events) => {
      debug(`Emitting debounced batched events - ${events.length}`);
      socket.emit(EventType.EVENTS_BATCH, events);
    },
    EMIT_DEBOUNCE_TIMEOUT,
    EMIT_DEBOUNCE_LIMIT
  );

  const client: RuntimeDebuggerClient = {
    onChange: (cb) => {
      socket.on(EventType.CHANGE_EVENT_NAME, cb);

      return () => socket.off(EventType.CHANGE_EVENT_NAME, cb);
    },
    onInput: (cb) => {
      socket.on(EventType.PUSH_INPUT_VALUE, cb);

      return () => socket.off(EventType.PUSH_INPUT_VALUE, cb);
    },
    emitInputChange: (changeData) => {
      debug(`Emitting input change event of ${changeData.insId}:${changeData.pinId}`);

      const depth = changeData.insId.split(".").length;

      debouncedSendBatchedEvent({
        type: RuntimeEventType.INPUT_CHANGE,
        id: `${changeData.insId}.${changeData.pinId}.input`,
        dt: dt(),
        val: toString(changeData.val),
        t: Date.now(),
      });

      // const hasBreakpoint = breakpoints.has(`${changeData.insId}.${changeData.pinId}.input`);

      // if (hasBreakpoint && isSimpleType(changeData.val)) {
      //   const valuePromise = new Promise((res) => {
      //     const cb = (data: DebuggerValue) => {
      //       if (
      //         changeData.insId === data.insId &&
      //         changeData.partId === data.partId &&
      //         changeData.pinId === data.pinId &&
      //         data.executionId === changeData.executionId
      //       ) {
      //         // console.log('bridge - got value from input', data.pinId, data.partId, data.insId);
      //         res(data.val);
      //         socket.off(EventType.INPUT_VALUE_OVERRIDE, cb);
      //       }
      //     };
      //     socket.on(EventType.INPUT_VALUE_OVERRIDE, cb);
      //   });
      //   socket.emit(EventType.INPUT_VALUE_CHANGE, [
      //     {
      //       ...changeData,
      //       val: toString(changeData.val),
      //     },
      //   ]);
      //   return {
      //     cmd: "intercept",
      //     valuePromise,
      //   };
      // } else {
      //   // not intercepting because the object is complex, serializing and deserializing over the wire is brittle. this can be solvable but not priority right now

      //   debounceEmitInput({
      //     ...changeData,
      //     val: toString(changeData.val),
      //   });
      //   return undefined;
      // }
    },
    emitOutputChange: (changeData) => {
      debug(
        `Emitting output change event of ${changeData.insId}:${changeData.pinId} -> [o%]`,
        changeData.val
      );

      debouncedSendBatchedEvent({
        type: RuntimeEventType.OUTPUT_CHANGE,
        id: `${changeData.insId}.${changeData.pinId}.output`,
        dt: dt(),
        val: toString(changeData.val),
        t: Date.now(),
      });

      // const hasBreakpoint = breakpoints.has(`${changeData.insId}.${changeData.pinId}.output`);
      // if (hasBreakpoint && isSimpleType(changeData.val)) {
      //   const valuePromise = new Promise((res) => {
      //     const cb = (data: DebuggerValue) => {
      //       if (
      //         changeData.insId === data.insId &&
      //         changeData.partId === data.partId &&
      //         changeData.pinId === data.pinId &&
      //         data.executionId === changeData.executionId
      //       ) {
      //         res(data.val);
      //         socket.off(EventType.OUTPUT_VALUE_OVERRIDE, cb);
      //       }
      //     };
      //     socket.on(EventType.OUTPUT_VALUE_OVERRIDE, cb);
      //   });
      //   socket.emit(EventType.OUTPUT_VALUE_CHANGE, [
      //     {
      //       ...changeData,
      //       val: toString(changeData.val),
      //     },
      //   ]);
      //   return {
      //     cmd: "intercept",
      //     valuePromise,
      //   };
      // } else {
      //   // not intercepting because the object is complex, serializing and deserializing over the wire is brittle. this can be solved but not priority right now
      //   debounceEmitOutput({
      //     ...changeData,
      //     val: toString(changeData.val),
      //   });

      //   return undefined;
      // }
    },
    emitProcessing: (val) => {
      const depth = val.insId.split(".").length;
      // socket.emit(EventType.PROCESSING_CHANGE, val);

      debouncedSendBatchedEvent({
        type: RuntimeEventType.PROCESSING_CHANGE,
        id: val.insId,
        dt: dt(),
        val: val.processing,
        t: Date.now(),
      });
    },
    emitInputsStateChange: (val) => {
      const depth = val.insId.split(".").length;
      // TODO - move it to the client's using it! Done for performance reasons
      // perhaps pass depth as another param to avoid split

      // socket.emit(EventType.INPUTS_STATE_CHANGE, val);

      debouncedSendBatchedEvent({
        type: RuntimeEventType.INPUTS_STATE_CHANGE,
        id: val.insId,
        dt: dt(),
        val: val.inputs,
        t: Date.now(),
      });
    },
    emitPartError: (val) => {
      const depth = val.insId.split(".").length;
      debug(`Emitting error event of ${val.insId}, error - [${val}]`);
      const serializedError = serializeError(val);
      // socket.emit(EventType.PART_ERROR, { ...val, error: serializedError });

      debouncedSendBatchedEvent({
        type: RuntimeEventType.ERROR,
        id: val.insId,
        dt: dt(),
        val: serializedError,
        t: Date.now(),
      });

      debouncedSendBatchedEvent({
        type: RuntimeEventType.OUTPUT_CHANGE,
        id: `${val.insId}.${ERROR_PIN_ID}.output`,
        dt: dt(),
        val: toString(val),
        t: Date.now(),
      });
    },
    // onProcessingChange: () => {},
    emitRuntimeReady: () => {
      socket.emit(EventType.RUNTIME_READY, {});
    },
    emitChangeAwk: () => {
      socket.emit(EventType.CHANGE_AWK, {});
    },
    emitChangeError: (error: Error) => {
      socket.emit(EventType.CHANGE_ERROR, { error });
    },
    emitIsAlive: (time) => {
      socket.emit(EventType.IS_ALIVE, { time });
    },
    destroy: () => {
      enumToArray(EventType).forEach((type) => socket.off(type));
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
