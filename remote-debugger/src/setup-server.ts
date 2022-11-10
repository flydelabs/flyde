import { Server as HttpServer } from "http";
import { EventType } from "./common";
import {
  Project,
  DebuggerValue,
  ProcessingChangeData,
  InputsStateChangeData,
  PartError,
  OMap,
  isDefined,
  debugLogger,
} from "@flyde/core";

import { Server } from "socket.io";
import { Express } from "express";
import { HistoryPayload, RuntimeEvent, RuntimeEvents } from ".";

const debug = debugLogger(`runtime-server`);

const MAX_LAST_EVENTS = 100;
const MAX_LAST_EVENTS_TAPE_SIZE = 10000;

type DebugHistoryMap = Map<string, { total: number; lastSamples: RuntimeEvent[] }>;

export const setupRemoteDebuggerServer = (
  httpServer: HttpServer,
  app: Express,
  stateRequester: () => OMap<Map<string, any>>,
  triggerPart: (partId: string, inputs: any) => any,
  onBatchedEvents?: (events: RuntimeEvents) => void
) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => cb(undefined, origin),
      credentials: true,
    },
  });

  let eventsTape: RuntimeEvents = [];

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
    const { id, limit } = req.query;

    const _limit = parseInt(limit as string) || 100;

    if (!id) {
      const partial = eventsTape.slice(0, _limit);
      res.json({ total: eventsTape.length, lastSamples: partial });
    } else {
      const payload: HistoryPayload = historyMap.get(id as string) || { total: 0, lastSamples: [] };
      const samples = payload.lastSamples.slice(0, _limit);
      res.json({ ...payload, lastSamples: samples });
    }

    // const _types: string[] = (types as string[]) || [];
    // const _limit = parseInt(limit as string) || 100;
    // const _id = (id as string) || "";

    // const filtered = eventsTape.filter((event) => {
    //   return (
    //     event.id.toLowerCase().includes(_id.toLocaleLowerCase()) &&
    //     (!_types.length || _types.includes(event.type))
    //   );
    // });

    // const total = filtered.length;

    // const lastSamples = filtered.reverse().slice(0, _limit);

    // const payload: HistoryPayload = {
    //   total,
    //   lastSamples,
    // };

    // res.json(payload);
  });

  app.delete("/history", (_, res) => {
    eventsTape = [];
    historyMap = new Map();
    res.send("ok");
  });

  let connections = [];
  io.on("connect", function (socket) {
    connections.push(socket.id);

    debug(`+ New connection! now on ${connections} - ${socket.id}, %o`, socket.data);
  });

  io.on("disconnect", function (socket) {
    connections = connections.filter((s) => s !== socket.id);
    debug(`- New disconnection! now on ${connections} - ${socket.id} %o`, socket.data);
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

    socket.on(EventType.CHANGE_EVENT_NAME, (data: {project: Project}) => {
      io.emit(EventType.CHANGE_EVENT_NAME, data);
    });

    socket.on(EventType.INPUT_VALUE_CHANGE, (data: DebuggerValue[]) => {
      io.emit(EventType.INPUT_VALUE_CHANGE, data);
    });

    socket.on(EventType.PUSH_INPUT_VALUE, (data: { pinId: string; value: any }) => {
      debug(`Emitting PUSH_INPUT_VALUE to ${data.pinId} with value: %o`, data.value);
      io.emit(EventType.PUSH_INPUT_VALUE, data);
    });

    socket.on(EventType.OUTPUT_VALUE_CHANGE, (data: DebuggerValue[]) => {
      io.emit(EventType.OUTPUT_VALUE_CHANGE, data);
    });

    socket.on(EventType.PROCESSING_CHANGE, (data: ProcessingChangeData) => {
      io.emit(EventType.PROCESSING_CHANGE, data);
    });

    socket.on(EventType.PART_ERROR, (data: PartError) => {
      io.emit(EventType.PART_ERROR, data);
    });

    socket.on(EventType.INPUTS_STATE_CHANGE, (data: InputsStateChangeData) => {
      io.emit(EventType.INPUTS_STATE_CHANGE, data);
    });

    socket.on(EventType.EVENTS_BATCH, (data: RuntimeEvents) => {
      io.emit(EventType.EVENTS_BATCH, data);

      data.forEach((event) => {
        const curr = historyMap.get(event.id) || { total: 0, lastSamples: [] };
        curr.lastSamples.unshift(event);
        if (curr.lastSamples.length > MAX_LAST_EVENTS) {
          curr.lastSamples.splice(MAX_LAST_EVENTS, curr.lastSamples.length - MAX_LAST_EVENTS);
        }
        curr.total++;
        historyMap.set(event.id, curr);
      });

      eventsTape.unshift(...data);

      if (eventsTape.length > MAX_LAST_EVENTS_TAPE_SIZE) {
        eventsTape = eventsTape.slice(0, MAX_LAST_EVENTS_TAPE_SIZE);
      }

      if (onBatchedEvents) {
        onBatchedEvents(data);
      }
    });

    socket.on(EventType.INPUT_VALUE_OVERRIDE, (data: DebuggerValue) => {
      io.emit(EventType.INPUT_VALUE_OVERRIDE, data);
    });

    socket.on(EventType.OUTPUT_VALUE_OVERRIDE, (data: DebuggerValue) => {
      io.emit(EventType.OUTPUT_VALUE_OVERRIDE, data);
    });

    socket.on(EventType.CHANGE_AWK, () => {
      io.emit(EventType.CHANGE_AWK, {});
    });

    socket.on(EventType.CHANGE_ERROR, () => {
      io.emit(EventType.CHANGE_ERROR, {});
    });

    socket.on(EventType.RUNTIME_READY, () => {
      io.emit(EventType.RUNTIME_READY, {});
    });

    socket.on(EventType.UPDATE_BREAKPOINTS, (data: string[]) => {
      io.emit(EventType.UPDATE_BREAKPOINTS, data);
    });

    socket.on(EventType.IS_ALIVE, (data: { time: number }) => {
      io.emit(EventType.IS_ALIVE, data);
    });
  });

  return io;
};
