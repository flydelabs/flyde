"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddedDebuggerServer = void 0;
const core_1 = require("@flyde/core");
const socket_io_1 = require("socket.io");
const debug = (0, core_1.debugLogger)(`embedded-debugger:server`);
const MAX_LAST_EVENTS = 100;
const MAX_LAST_EVENTS_TAPE_SIZE = 10000;
const historyKeyMap = (dto) => {
    return `${dto.executionId}.${dto.insId}.${dto.pinId || "__no_pin"}`;
};
const emptyHistory = { total: 0, lastSamples: [] };
class EmbeddedDebuggerServer {
    constructor(httpServer, app, onBatchedEvents) {
        this.httpServer = httpServer;
        this.app = app;
        this.onBatchedEvents = onBatchedEvents;
        this.eventsTape = [];
        this.pinHistoryMap = new Map();
        this.insHistoryMap = new Map();
        this.connectionIds = [];
        this.setupSocketServer();
        this.setupHttpEndpoints();
    }
    setupSocketServer() {
        this.io = new socket_io_1.Server(this.httpServer, {
            cors: {
                origin: (origin, cb) => cb(null, origin),
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
        this.io.on("connection", (socket) => {
            socket.on("join-room-runtime", (roomId) => {
                socket.join(roomId);
            });
            socket.on("join-room-editor", (roomId) => {
                socket.join(roomId);
            });
            socket.on(core_1.DebuggerServerEventType.EVENTS_BATCH, (data) => {
                this.handleEventsBatch(data);
            });
            // Essential debugger events for VS Code
            socket.on(core_1.DebuggerServerEventType.PUSH_INPUT_VALUE, (data) => {
                debug(`Emitting PUSH_INPUT_VALUE to ${data.pinId}`);
                this.io.emit(core_1.DebuggerServerEventType.PUSH_INPUT_VALUE, data);
            });
            socket.on(core_1.DebuggerServerEventType.INPUT_VALUE_CHANGE, (data) => {
                this.io.emit(core_1.DebuggerServerEventType.INPUT_VALUE_CHANGE, data);
            });
            socket.on(core_1.DebuggerServerEventType.OUTPUT_VALUE_CHANGE, (data) => {
                this.io.emit(core_1.DebuggerServerEventType.OUTPUT_VALUE_CHANGE, data);
            });
            socket.on(core_1.DebuggerServerEventType.PROCESSING_CHANGE, (data) => {
                this.io.emit(core_1.DebuggerServerEventType.PROCESSING_CHANGE, data);
            });
            socket.on(core_1.DebuggerServerEventType.RUNTIME_READY, () => {
                this.io.emit(core_1.DebuggerServerEventType.RUNTIME_READY, {});
            });
            socket.on(core_1.DebuggerServerEventType.UPDATE_BREAKPOINTS, (data) => {
                this.io.emit(core_1.DebuggerServerEventType.UPDATE_BREAKPOINTS, data);
            });
            socket.on(core_1.DebuggerServerEventType.IS_ALIVE, (data) => {
                this.io.emit(core_1.DebuggerServerEventType.IS_ALIVE, data);
            });
        });
    }
    setupHttpEndpoints() {
        this.app.get("/state", (_, res) => {
            // Simplified state for VS Code - empty state is fine for basic debugging
            res.send({ state: {} });
        });
        this.app.get("/history", (req, res) => {
            const { insId, pinId, limit, executionId: _executionId } = req.query;
            const _limit = parseInt(limit) || 100;
            if (typeof insId !== "string" || typeof _executionId !== "string") {
                res.status(400).send("bad parameters");
                return;
            }
            const executionId = decodeURIComponent(_executionId);
            const payload = this.getHistory({ insId, pinId: pinId, executionId });
            const samples = payload.lastSamples.slice(0, _limit);
            res.json({ ...payload, lastSamples: samples });
        });
        this.app.get("/full-history", (req, res) => {
            const mapToObj = (map) => Array.from(map.entries()).reduce((acc, [k, v]) => {
                return { ...acc, [k]: v };
            }, {});
            res.json({
                pinHistoryMap: mapToObj(this.pinHistoryMap),
                insHistoryMap: mapToObj(this.insHistoryMap),
            });
        });
        this.app.delete("/history", (_, res) => {
            this.eventsTape = [];
            this.pinHistoryMap = new Map();
            this.insHistoryMap = new Map();
            res.send("ok");
        });
        this.app.get("/connections", (_, res) => {
            res.json({ connections: this.connectionIds });
        });
    }
    getHistory(dto) {
        const key = historyKeyMap(dto);
        const map = dto.pinId ? this.pinHistoryMap : this.insHistoryMap;
        return map.get(key) ?? emptyHistory;
    }
    handleEventsBatch(data) {
        const executionId = data[0].executionId;
        this.io.to(executionId).emit(core_1.DebuggerServerEventType.EVENTS_BATCH, data);
        // Process events for history
        data.forEach((event) => {
            if (event.type === core_1.DebuggerEventType.ERROR) {
                const ev = event;
                ev.type = core_1.DebuggerEventType.OUTPUT_CHANGE;
                ev.pinId = core_1.ERROR_PIN_ID;
            }
            if (event.type === core_1.DebuggerEventType.INPUT_CHANGE ||
                event.type === core_1.DebuggerEventType.OUTPUT_CHANGE) {
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
exports.EmbeddedDebuggerServer = EmbeddedDebuggerServer;
//# sourceMappingURL=embedded-debugger-server.js.map