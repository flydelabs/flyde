"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmbeddedServer = exports.EmbeddedServer = void 0;
const express = require("express");
const http_1 = require("http");
const path_1 = require("path");
const embedded_debugger_server_1 = require("./debugger/embedded-debugger-server");
class EmbeddedServer {
    constructor(options, onBatchedEvents) {
        this.options = options;
        this.onBatchedEvents = onBatchedEvents;
        this.setupServer();
    }
    setupServer() {
        const app = express();
        this.httpServer = (0, http_1.createServer)(app);
        // Basic middleware
        app.use((_, res, next) => {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
            next();
        });
        // Setup embedded debugger
        this.debuggerServer = new embedded_debugger_server_1.EmbeddedDebuggerServer(this.httpServer, app, this.onBatchedEvents);
        // Serve static editor files (webview assets)
        app.use("/", express.static(this.options.editorStaticsRoot));
        // Catch-all for editor
        app.use(["/", "/*"], async (req, res, next) => {
            const path = (0, path_1.join)(this.options.editorStaticsRoot, "index.html");
            res.sendFile(path);
        });
        this.httpServer.listen(this.options.port);
        console.log(`Embedded server running on port ${this.options.port}`);
    }
    async close() {
        this.debuggerServer?.dispose();
        if (this.httpServer) {
            await new Promise((resolve) => {
                this.httpServer.close(resolve);
            });
        }
    }
}
exports.EmbeddedServer = EmbeddedServer;
const createEmbeddedServer = (options, onBatchedEvents) => {
    const server = new EmbeddedServer(options, onBatchedEvents);
    return async function cleanupEmbeddedServer() {
        await server.close();
    };
};
exports.createEmbeddedServer = createEmbeddedServer;
//# sourceMappingURL=embedded-server.js.map