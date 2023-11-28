import { Server as HttpServer } from "http";
import { DebuggerServerEventType } from "./common";
import {
  OMap,
  isDefined,
  debugLogger,
  DebuggerEvent,
  DebuggerEventType,
  ERROR_PIN_ID,
  PinDebuggerEvent,
} from "@flyde/core";

import { Server } from "socket.io";
import { Express } from "express";
import { HistoryPayload } from ".";

const debug = debugLogger(`remote-debugger:server`);

const MAX_LAST_EVENTS = 100;
const MAX_LAST_EVENTS_TAPE_SIZE = 10000;

type DebugHistoryMap = Map<
  string,
  { total: number; lastSamples: DebuggerEvent[] }
>;

export type HistoryKey = {
  executionId: string;
  insId: string;
  pinId?: string | undefined;
};

const historyKeyMap = <T extends HistoryKey>(dto: T) => {
  return `${dto.executionId}.${dto.insId}.${dto.pinId || "__no_pin"}`;
};

const emptyHistory = { total: 0, lastSamples: [] };

export const setupRemoteDebuggerServer = (
  httpServer: HttpServer,
  app: Express,
  stateRequester: () => OMap<Map<string, any>>,
  triggerNode: (nodeId: string, inputs: any) => any,
  onBatchedEvents?: (events: DebuggerEvent[]) => void
) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => cb(null, origin),
      credentials: true,
    },
  });

  let eventsTape: DebuggerEvent[] = [];

  let pinHistoryMap: DebugHistoryMap = new Map();
  let insHistoryMap: DebugHistoryMap = new Map();

  const getHistory = (dto: HistoryKey) => {
    const key = historyKeyMap(dto);
    const map = dto.pinId ? pinHistoryMap : insHistoryMap;
    return map.get(key) ?? emptyHistory;
  };

  app.post("/trigger", (req, res) => {
    const { nodeId, inputs } = req.body;
    try {
      const result = triggerNode(nodeId, inputs);
      res.send(result);
    } catch (e) {
      debug(`Error triggering node: %e`, e);
      console.error(e);

      res.status(400).send(e.message);
    }
  });

  app.get("/state", (_, res) => {
    const state = stateRequester();
    const objectifiedState = {};
    for (const key in state) {
      const m = state[key] ?? new Map();
      const obj = Array.from(m.entries()).reduce((acc, [k, v]) => {
        if (typeof k !== "string") {
          throw new Error(
            `Trying to serialize a map with a key that is not string, but ${typeof k}`
          );
        }
        if (isDefined(v) && !(Array.isArray(v) && v.length === 0)) {
          return { ...acc, [k]: v };
        } else {
          return acc;
        }
      }, {});

      if (Object.keys(obj).length > 0) {
        objectifiedState[key] = obj;
      }
    }

    res.send({ state: objectifiedState });
  });

  app.get("/history", (req, res) => {
    const { insId, pinId, limit, executionId: _executionId } = req.query;

    const _limit = parseInt(limit as string) || 100;

    if (typeof insId !== "string") {
      res.status(400).send("bad insId");
      return;
    }

    if (typeof pinId !== "string" && typeof pinId !== "undefined") {
      res.status(400).send("bad pinId");
      return;
    }

    if (typeof _executionId !== "string") {
      res.status(400).send("bad executionId");
      return;
    }

    const executionId = decodeURIComponent(_executionId);

    const payload: HistoryPayload = getHistory({ insId, pinId, executionId });
    const samples = payload.lastSamples.slice(0, _limit);
    res.json({ ...payload, lastSamples: samples });
  });

  app.get("/full-history", (req, res) => {
    const mapToObj = (map: DebugHistoryMap) =>
      Array.from(map.entries()).reduce((acc, [k, v]) => {
        return { ...acc, [k]: v };
      }, {});

    res.json({
      pinHistoryMap: mapToObj(pinHistoryMap),
      insHistoryMap: mapToObj(insHistoryMap),
    });
  });

  app.delete("/history", (_, res) => {
    eventsTape = [];
    pinHistoryMap = new Map();
    res.send("ok");
  });

  let connectionIds: string[] = [];
  io.on("connect", function (socket) {
    connectionIds.push(socket.id);

    debug(
      `+ New connection! now on ${connectionIds} - ${socket.id}, %o`,
      socket.data
    );
  });

  io.on("disconnect", function (socket) {
    connectionIds = connectionIds.filter((s) => s !== socket.id);
    debug(
      `- New disconnection! now on ${connectionIds} - ${socket.id} %o`,
      socket.data
    );
  });

  app.get("/connections", (_, res) => {
    res.json({ connections: connectionIds });
  });

  io.on("connection", (socket: any) => {
    socket.on("join-room-runtime", (roomId: string) => {
      socket.join(roomId);
    });

    socket.on("join-room-editor", (roomId: string) => {
      socket.join(roomId);
    });

    socket.on(DebuggerServerEventType.CHANGE_EVENT_NAME, (data: {}) => {
      io.emit(DebuggerServerEventType.CHANGE_EVENT_NAME, data);
    });

    socket.on(
      DebuggerServerEventType.INPUT_VALUE_CHANGE,
      (data: DebuggerEvent[]) => {
        io.emit(DebuggerServerEventType.INPUT_VALUE_CHANGE, data);
      }
    );

    socket.on(
      DebuggerServerEventType.PUSH_INPUT_VALUE,
      (data: { pinId: string; value: any }) => {
        debug(
          `Emitting PUSH_INPUT_VALUE to ${data.pinId} with value: %o`,
          data.value
        );
        io.emit(DebuggerServerEventType.PUSH_INPUT_VALUE, data);
      }
    );

    socket.on(
      DebuggerServerEventType.OUTPUT_VALUE_CHANGE,
      (data: DebuggerEvent[]) => {
        io.emit(DebuggerServerEventType.OUTPUT_VALUE_CHANGE, data);
      }
    );

    socket.on(
      DebuggerServerEventType.PROCESSING_CHANGE,
      (data: DebuggerEvent) => {
        io.emit(DebuggerServerEventType.PROCESSING_CHANGE, data);
      }
    );

    socket.on(
      DebuggerServerEventType.INPUTS_STATE_CHANGE,
      (data: DebuggerEvent) => {
        io.emit(DebuggerServerEventType.INPUTS_STATE_CHANGE, data);
      }
    );

    socket.on(DebuggerServerEventType.EVENTS_BATCH, (data: DebuggerEvent[]) => {
      const executionId = data[0].executionId; // this assumes all events in the batch are from the same execution. TODO - check this assumption
      io.to(executionId).emit(DebuggerServerEventType.EVENTS_BATCH, data);

      data.forEach((event) => {
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
          const pinMapKey = historyKeyMap(event);
          const insMapKey = historyKeyMap({ ...event, pinId: undefined });
          const pinHistory = pinHistoryMap.get(pinMapKey) ?? {
            total: 0,
            lastSamples: [],
          };
          const insHistory = insHistoryMap.get(insMapKey) ?? {
            total: 0,
            lastSamples: [],
          };
          [pinHistory, insHistory].forEach((curr) => {
            curr.lastSamples.unshift(event);
            if (curr.lastSamples.length > MAX_LAST_EVENTS) {
              curr.lastSamples.splice(
                MAX_LAST_EVENTS,
                curr.lastSamples.length - MAX_LAST_EVENTS
              );
            }
            curr.total++;
          });
          pinHistoryMap.set(pinMapKey, pinHistory);
          insHistoryMap.set(insMapKey, insHistory);
        }
      });

      eventsTape.unshift(...data);

      if (eventsTape.length > MAX_LAST_EVENTS_TAPE_SIZE) {
        eventsTape = eventsTape.slice(0, MAX_LAST_EVENTS_TAPE_SIZE);
      }

      if (onBatchedEvents) {
        onBatchedEvents(data);
      }
    });

    socket.on(
      DebuggerServerEventType.INPUT_VALUE_OVERRIDE,
      (data: DebuggerEvent) => {
        io.emit(DebuggerServerEventType.INPUT_VALUE_OVERRIDE, data);
      }
    );

    socket.on(
      DebuggerServerEventType.OUTPUT_VALUE_OVERRIDE,
      (data: DebuggerEvent) => {
        io.emit(DebuggerServerEventType.OUTPUT_VALUE_OVERRIDE, data);
      }
    );

    socket.on(DebuggerServerEventType.CHANGE_AWK, () => {
      io.emit(DebuggerServerEventType.CHANGE_AWK, {});
    });

    socket.on(DebuggerServerEventType.CHANGE_ERROR, () => {
      io.emit(DebuggerServerEventType.CHANGE_ERROR, {});
    });

    socket.on(DebuggerServerEventType.RUNTIME_READY, () => {
      io.emit(DebuggerServerEventType.RUNTIME_READY, {});
    });

    socket.on(DebuggerServerEventType.UPDATE_BREAKPOINTS, (data: string[]) => {
      io.emit(DebuggerServerEventType.UPDATE_BREAKPOINTS, data);
    });

    socket.on(DebuggerServerEventType.IS_ALIVE, (data: { time: number }) => {
      io.emit(DebuggerServerEventType.IS_ALIVE, data);
    });
  });

  return io;
};
