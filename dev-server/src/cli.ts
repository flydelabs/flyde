#!/usr/bin/env node
require("source-map-support").install();

import args from "args";
import { join } from "path";
import { initFlydeDevServer, InitFlydeDevServerOptions } from "./lib";

const DEFAULT_PORT = 8545;

args
  .option("port", "Port to run dev server on", DEFAULT_PORT)
  .option("root", "Root directory to scan for files", process.cwd())
  .option(
    "editor-statics-root",
    "Root directory for editor static files",
    join(__dirname, "../../editor/build")
  );

const options = args.parse(process.argv) as InitFlydeDevServerOptions;

initFlydeDevServer(options);
