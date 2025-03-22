import { FlydeFlow, flydeFlowSchema } from "@flyde/core";
import * as yaml from "yaml";
import _ = require("lodash");
import { readFileSync } from "fs";

import { runMigrations } from "./migrations/runMigrations";

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    moduleResolution: "NodeNext",
    module: "NodeNext",
  },
});

export function deserializeFlow(flowContents: string, path: string): FlydeFlow {
  const unsafeflow = yaml.parse(flowContents);

  const result = flydeFlowSchema.safeParse(unsafeflow);
  if (result.success === false) {
    throw new Error(`Error parsing Flyde flow ${result.error} from ${path}`);
  }

  const data = result.data;

  const imports = _.mapValues(data.imports || {}, (value) => {
    return typeof value === "string" ? [value] : value;
  });

  data.imports = imports;

  runMigrations(data as any);
  if (!data.node.inputsPosition) {
    data.node.inputsPosition = {};
  }

  if (!data.node.outputsPosition) {
    data.node.outputsPosition = {};
  }

  return data as FlydeFlow;
}

export function deserializeFlowByPath(path: string): FlydeFlow {
  try {
    return deserializeFlow(readFileSync(path, "utf8"), path);
  } catch (e) {
    console.error(`Error loading flow at ${path}`, e);
    throw new Error(`Error loading flow at ${path} - ${e}`);
  }
}
