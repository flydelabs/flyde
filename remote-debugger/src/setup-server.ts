import { Server as HttpServer } from "http";
import { DebuggerServerEventType } from "./common";
import {
  Project,
  PartError,
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

const debug = debugLogger(`runtime-server`);

const MAX_LAST_EVENTS = 100;
const MAX_LAST_EVENTS_TAPE_SIZE = 10000;

type DebugHistoryMap = Map<
  string,
  { total: number; lastSamples: DebuggerEvent[] }
>;

export type HistoryKey = { insId: string; pinId: string };

const historyKeyMap = <T extends HistoryKey>(dto: T) => {
  return `${dto.insId}.${dto.pinId || "__no_pin"}`;
};

export const setupRemoteDebuggerServer = (
  httpServer: HttpServer,
  app: Express,
  stateRequester: () => OMap<Map<string, any>>,
  triggerPart: (partId: string, inputs: any) => any,
  onBatchedEvents?: (events: DebuggerEvent[]) => void
) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => cb(undefined, origin),
      credentials: true,
    },
  });

  let eventsTape: DebuggerEvent[] = [];

  let historyMap: DebugHistoryMap = new Map();

  app.post("/trigger", (req, res) => {
    const { partId, inputs } = req.body;
    try {
      const result = triggerPart(partId, inputs);
      res.send(result);
    } catch (e) {
      debug(`Error triggering part: %e`, e);
      console.log(e);

      res.status(400).send(e.message);
    }
  });

  app.get("/state", (_, res) => {
    const state = stateRequester();
    const objectifiedState = {};
    for (const key in state) {
      const m = state[key];
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
    const { insId, pinId, limit } = req.query;

    const _limit = parseInt(limit as string) || 100;

    if (typeof insId !== "string" || typeof pinId !== "string") {
      res.status(400).send("bad insId or pinId");
      return;
    }

    const payload: HistoryPayload = historyMap.get(
      historyKeyMap({ insId, pinId })
    ) || { total: 0, lastSamples: [] };
    const samples = payload.lastSamples.slice(0, _limit);
    res.json({ ...payload, lastSamples: samples });
  });

  app.get("/full-history", (req, res) => {
    res.json(historyMap);
  });

  app.delete("/history", (_, res) => {
    eventsTape = [];
    historyMap = new Map();
    res.send("ok");
  });

  let connections = [];
  io.on("connect", function (socket) {
    connections.push(socket.id);

    debug(
      `+ New connection! now on ${connections} - ${socket.id}, %o`,
      socket.data
    );
  });

  io.on("disconnect", function (socket) {
    connections = connections.filter((s) => s !== socket.id);
    debug(
      `- New disconnection! now on ${connections} - ${socket.id} %o`,
      socket.data
    );
  });

  app.get("/connections", (_, res) => {
    res.json({ connections });
  });

  io.on("connection", (socket: any) => {
    // socket.on("join-room-runtime", (roomId: string) => {
    //   socket.join(roomId);
    // })

    // socket.on("join-room-editor", (roomId: string) => {
    //   socket.join(roomId);
    // })

    socket.on(
      DebuggerServerEventType.CHANGE_EVENT_NAME,
      (data: { project: Project }) => {
        io.emit(DebuggerServerEventType.CHANGE_EVENT_NAME, data);
      }
    );

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

    socket.on(DebuggerServerEventType.PART_ERROR, (data: PartError) => {
      io.emit(DebuggerServerEventType.PART_ERROR, data);
    });

    socket.on(
      DebuggerServerEventType.INPUTS_STATE_CHANGE,
      (data: DebuggerEvent) => {
        io.emit(DebuggerServerEventType.INPUTS_STATE_CHANGE, data);
      }
    );

    socket.on(DebuggerServerEventType.EVENTS_BATCH, (data: DebuggerEvent[]) => {
      io.emit(DebuggerServerEventType.EVENTS_BATCH, data);

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
          const mapKey = historyKeyMap(event);
          const curr = historyMap.get(mapKey) || { total: 0, lastSamples: [] };
          curr.lastSamples.unshift(event);
          if (curr.lastSamples.length > MAX_LAST_EVENTS) {
            curr.lastSamples.splice(
              MAX_LAST_EVENTS,
              curr.lastSamples.length - MAX_LAST_EVENTS
            );
          }
          curr.total++;
          historyMap.set(mapKey, curr);
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
