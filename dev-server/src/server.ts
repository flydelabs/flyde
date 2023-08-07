import express from "express";
import { createService } from "./service/service";

import { setupRemoteDebuggerServer } from "@flyde/remote-debugger/dist/setup-server";
import { createServer } from "http";
import { scanImportableNodes } from "./service/scan-importable-nodes";
import { deserializeFlow, resolveDependencies } from "@flyde/resolver";
import { join } from "path";

import resolveFrom = require("resolve-from");
import { readFileSync } from "fs";
import { generateAndSaveNode } from "./service/generate-node-from-prompt";

export const runDevServer = (
  port: number,
  rootDir: string,
  editorStaticRoot: string
) => {
  const service = createService(rootDir);

  const app = express();

  const server = createServer(app);

  app.use(express.json());

  app.use((_, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");

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

  app.get("/resolveDefinitions", async (req, res) => {
    try {
      const { filename } = req.query as { filename: string };
      if (!filename) {
        res.status(400).send("missing filename");
        return;
      }

      const fullPath = resolveFrom(rootDir, filename);
      const flow = deserializeFlow(readFileSync(fullPath, "utf-8"), fullPath);
      const deps = await resolveDependencies(flow, "definition", fullPath);
      res.send({ ...deps, [flow.part.id]: flow.part });
    } catch (e) {
      console.error(e);
      res.status(400).send(e);
    }
  });

  app.post("/generateNode", async (req, res) => {
    const { prompt } = req.body as { prompt: string };

    if (prompt.trim().length === 0) {
      res.status(400).send("prompt is empty");
      return;
    }

    try {
      const data = await generateAndSaveNode(rootDir, prompt);
      res.send(data);
    } catch (e) {
      res.status(400).send(e);
    }
  });

  app.use("/editor", express.static(editorStaticRoot));

  app.use(["/editor", "/editor/*"], async (req, res, next) => {
    const path = join(editorStaticRoot, "index.html");
    res.sendFile(path);
  });

  setupRemoteDebuggerServer(
    server,
    app,
    () => null,
    () => null
  );

  server.listen(port);
  return server;
};
