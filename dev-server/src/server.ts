import express from "express";
import cors from "cors";
import { createService } from "./service/service";

import { setupRemoteDebuggerServer } from "@flyde/remote-debugger/dist/setup-server";
import { createServer } from "http";
import { resolveFlowByPath } from "@flyde/resolver";
import { join } from "path";

import { getLibraryData } from "./service/get-library-data";
import { scanImportableNodes } from "./service/scan-importable-nodes";

export const runDevServer = (
  port: number,
  rootDir: string,
  editorStaticRoot: string
) => {
  const service = createService(rootDir);

  const app = express();

  const server = createServer(app);

  app.use(express.json());
  app.use(cors());

  app.use((_, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  app.get("/structure", async (req, res) => {
    const structure = await service.scanFolderStructure(rootDir);
    res.json(structure);
  });

  app.get("/file", async (req, res) => {
    const { name } = req.query;
    const data = await service.readFile(name as string);
    res.send(data);
  });

  app.put("/file", async (req, res) => {
    const { name } = req.query;
    const data = req.body;
    try {
      await service.saveFile(name as string, data);
      res.send("ok");
    } catch (e) {
      res.status(400).send(e);
    }
  });

  app.get("/importables", async (req, res) => {
    const { filename } = req.query as { filename: string };
    try {
      const importables = await scanImportableNodes(rootDir, filename);
      res.send(importables);
    } catch (e) {
      console.error(e);
      res.status(400).send(e);
    }
  });

  app.get("/resolveFlow", async (req, res) => {
    try {
      const { filename } = req.query as { filename: string };
      if (!filename) {
        res.status(400).send("missing filename");
        return;
      }

      const fullPath = join(rootDir, filename);

      const resolvedFlow = await resolveFlowByPath(fullPath);
      res.send(resolvedFlow);
    } catch (e) {
      console.error(e);
      res.status(400).send(e);
    }
  });

  app.get("/library", async (req, res) => {
    const library = getLibraryData();
    res.send(library);
  });

  setupRemoteDebuggerServer(
    server,
    app,
    () => null,
    () => null
  );

  app.use("/", express.static(editorStaticRoot));

  app.use(["/", "/*"], async (req, res, next) => {
    const path = join(editorStaticRoot, "index.html");
    res.sendFile(path);
  });

  server.listen(port);
  return server;
};
