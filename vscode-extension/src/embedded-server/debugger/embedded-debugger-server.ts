import { Server as HttpServer } from "http";
import {
  DebuggerServerEventType,
  OMap,
  isDefined,
  debugLogger,
  DebuggerEvent,
  DebuggerEventType,
  ERROR_PIN_ID,
  PinDebuggerEvent,
  HistoryPayload,
} from "@flyde/core";

import { Server } from "socket.io";
import { Express, Request, Response } from "express";

const debug = debugLogger(`embedded-debugger:server`);

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

export class EmbeddedDebuggerServer {
  private io!: Server;
  private eventsTape: DebuggerEvent[] = [];
  private pinHistoryMap: DebugHistoryMap = new Map();
  private insHistoryMap: DebugHistoryMap = new Map();
  private connectionIds: string[] = [];

  constructor(
    private httpServer: HttpServer,
    private app: Express,
    private onBatchedEvents?: (events: DebuggerEvent[]) => void
  ) {
    this.setupSocketServer();
    this.setupHttpEndpoints();
  }

  private setupSocketServer() {
    this.io = new Server(this.httpServer, {
      cors: {
        origin: (origin: any, cb: any) => cb(null, origin),
        credentials: true,
      },
    });

    this.io.on("connect", (socket) => {
      this.connectionIds.push(socket.id);
      debug(`+ New connection! ${socket.id}`);
    });

    this.io.on("disconnect", (socket) => {
      this.connectionIds = this.connectionIds.filter((s) => s !== socket.id);
      debug(`- Disconnection! ${socket.id}`);
    });

    this.io.on("connection", (socket: any) => {
      socket.on("join-room-runtime", (roomId: string) => {
        socket.join(roomId);
      });

      socket.on("join-room-editor", (roomId: string) => {
        socket.join(roomId);
      });

      socket.on(DebuggerServerEventType.EVENTS_BATCH, (data: DebuggerEvent[]) => {
        this.handleEventsBatch(data);
      });

      // Essential debugger events for VS Code
      socket.on(DebuggerServerEventType.PUSH_INPUT_VALUE, (data: { pinId: string; value: any }) => {
        debug(`Emitting PUSH_INPUT_VALUE to ${data.pinId}`);
        this.io.emit(DebuggerServerEventType.PUSH_INPUT_VALUE, data);
      });

      socket.on(DebuggerServerEventType.INPUT_VALUE_CHANGE, (data: DebuggerEvent[]) => {
        this.io.emit(DebuggerServerEventType.INPUT_VALUE_CHANGE, data);
      });

      socket.on(DebuggerServerEventType.OUTPUT_VALUE_CHANGE, (data: DebuggerEvent[]) => {
        this.io.emit(DebuggerServerEventType.OUTPUT_VALUE_CHANGE, data);
      });

      socket.on(DebuggerServerEventType.PROCESSING_CHANGE, (data: DebuggerEvent) => {
        this.io.emit(DebuggerServerEventType.PROCESSING_CHANGE, data);
      });

      socket.on(DebuggerServerEventType.RUNTIME_READY, () => {
        this.io.emit(DebuggerServerEventType.RUNTIME_READY, {});
      });

      socket.on(DebuggerServerEventType.UPDATE_BREAKPOINTS, (data: string[]) => {
        this.io.emit(DebuggerServerEventType.UPDATE_BREAKPOINTS, data);
      });

      socket.on(DebuggerServerEventType.IS_ALIVE, (data: { time: number }) => {
        this.io.emit(DebuggerServerEventType.IS_ALIVE, data);
      });
    });
  }

  private setupHttpEndpoints() {
    this.app.get("/state", (_: Request, res: Response) => {
      // Simplified state for VS Code - empty state is fine for basic debugging
      res.send({ state: {} });
    });

    this.app.get("/history", (req: Request, res: Response) => {
      const { insId, pinId, limit, executionId: _executionId } = req.query;
      const _limit = parseInt(limit as string) || 100;

      if (typeof insId !== "string" || typeof _executionId !== "string") {
        res.status(400).send("bad parameters");
        return;
      }

      const executionId = decodeURIComponent(_executionId);
      const payload: HistoryPayload = this.getHistory({ insId, pinId: pinId as string, executionId });
      const samples = payload.lastSamples.slice(0, _limit);
      res.json({ ...payload, lastSamples: samples });
    });

    this.app.get("/full-history", (req: Request, res: Response) => {
      const mapToObj = (map: DebugHistoryMap) =>
        Array.from(map.entries()).reduce((acc, [k, v]) => {
          return { ...acc, [k]: v };
        }, {});

      res.json({
        pinHistoryMap: mapToObj(this.pinHistoryMap),
        insHistoryMap: mapToObj(this.insHistoryMap),
      });
    });

    this.app.delete("/history", (_: Request, res: Response) => {
      this.eventsTape = [];
      this.pinHistoryMap = new Map();
      this.insHistoryMap = new Map();
      res.send("ok");
    });

    this.app.get("/connections", (_: Request, res: Response) => {
      res.json({ connections: this.connectionIds });
    });
  }

  private getHistory(dto: HistoryKey) {
    const key = historyKeyMap(dto);
    const map = dto.pinId ? this.pinHistoryMap : this.insHistoryMap;
    return map.get(key) ?? emptyHistory;
  }

  private handleEventsBatch(data: DebuggerEvent[]) {
    const executionId = data[0].executionId;
    this.io.to(executionId).emit(DebuggerServerEventType.EVENTS_BATCH, data);

    // Process events for history
    data.forEach((event) => {
      if (event.type === DebuggerEventType.ERROR) {
        const ev: PinDebuggerEvent<DebuggerEventType.OUTPUT_CHANGE> = event as any;
        ev.type = DebuggerEventType.OUTPUT_CHANGE;
        ev.pinId = ERROR_PIN_ID;
      }

      if (
        event.type === DebuggerEventType.INPUT_CHANGE ||
        event.type === DebuggerEventType.OUTPUT_CHANGE
      ) {
        const pinMapKey = historyKeyMap(event);
        const insMapKey = historyKeyMap({ ...event, pinId: undefined });
        
        const pinHistory = this.pinHistoryMap.get(pinMapKey) ?? { total: 0, lastSamples: [] };
        const insHistory = this.insHistoryMap.get(insMapKey) ?? { total: 0, lastSamples: [] };
        
        [pinHistory, insHistory].forEach((curr) => {
          curr.lastSamples.unshift(event);
          if (curr.lastSamples.length > MAX_LAST_EVENTS) {
            curr.lastSamples.splice(MAX_LAST_EVENTS, curr.lastSamples.length - MAX_LAST_EVENTS);
          }
          curr.total++;
        });
        
        this.pinHistoryMap.set(pinMapKey, pinHistory);
        this.insHistoryMap.set(insMapKey, insHistory);
      }
    });

    this.eventsTape.unshift(...data);
    if (this.eventsTape.length > MAX_LAST_EVENTS_TAPE_SIZE) {
      this.eventsTape = this.eventsTape.slice(0, MAX_LAST_EVENTS_TAPE_SIZE);
    }

    if (this.onBatchedEvents) {
      this.onBatchedEvents(data);
    }
  }

  dispose() {
    this.io.close();
  }
}