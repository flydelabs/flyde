#!/usr/bin/env node
require('source-map-support').install();

import * as args from 'args';
import { initFlydeDevServer, InitFlydeDevServerOptions } from "./lib";

const DEFAULT_PORT = 8545;

args
  .option('port', 'Port to run dev server on', DEFAULT_PORT)
  .option('root', 'Root directory to scan for files', process.cwd())

const options = args.parse(process.argv) as InitFlydeDevServerOptions;

initFlydeDevServer(options);