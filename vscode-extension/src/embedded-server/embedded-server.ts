import * as express from "express";
import { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { join } from "path";
import { EmbeddedDebuggerServer } from "./debugger/embedded-debugger-server";
import { DebuggerEvent } from "@flyde/core";

export interface EmbeddedServerOptions {
  port: number;
  editorStaticsRoot: string;
}

export class EmbeddedServer {
  private httpServer: any;
  private debuggerServer!: EmbeddedDebuggerServer;

  constructor(
    private options: EmbeddedServerOptions,
    private onBatchedEvents?: (events: DebuggerEvent[]) => void
  ) {
    this.setupServer();
  }

  private setupServer() {
    const app = express();
    this.httpServer = createServer(app);

    // Basic middleware
    app.use((_: Request, res: Response, next: NextFunction) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      next();
    });

    // Setup embedded debugger
    this.debuggerServer = new EmbeddedDebuggerServer(
      this.httpServer,
      app,
      this.onBatchedEvents
    );

    // Serve static editor files (webview assets)
    app.use("/", express.static(this.options.editorStaticsRoot));

    // Catch-all for editor
    app.use(["/", "/*"], async (req: Request, res: Response, next: NextFunction) => {
      const path = join(this.options.editorStaticsRoot, "index.html");
      res.sendFile(path);
    });

    this.httpServer.listen(this.options.port);
    console.log(`Embedded server running on port ${this.options.port}`);
  }

  async close() {
    this.debuggerServer?.dispose();
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer.close(resolve);
      });
    }
  }
}

export const createEmbeddedServer = (
  options: EmbeddedServerOptions,
  onBatchedEvents?: (events: DebuggerEvent[]) => void
): (() => Promise<void>) => {
  const server = new EmbeddedServer(options, onBatchedEvents);
  
  return async function cleanupEmbeddedServer() {
    await server.close();
  };
};