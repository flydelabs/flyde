import {
  FlydeFlow,
  NodeInstance,
  flydeFlowSchema,
  isRefNodeInstance,
} from "@flyde/core";
import * as yaml from "yaml";
import _ = require("lodash");
import { readFileSync } from "fs";

require("ts-node").register({
  // Most ts-node options can be specified here using their programmatic names.
  transpileOnly: true,
  // It is faster to skip typechecking.
  // Remove if you want ts-node to do typechecking.
  // }
});

const macroMigrationsMap = {
  "GET Request": {
    id: "Http",
    data: {
      method: { mode: "static", value: "GET" },
      url: { mode: "dynamic" },
      headers: { mode: "static", value: {} },
      params: { mode: "static", value: {} },
    },
  },
  "POST Request": {
    id: "Http",
    data: {
      method: { mode: "static", value: "POST" },
      data: { mode: "dynamic" },
      url: { mode: "dynamic" },
      headers: { mode: "static", value: {} },
      params: { mode: "static", value: {} },
    },
  },
  Debounce: {
    id: "Debounce",
    data: {
      mode: "static",
      timeMs: 1000,
    },
  },
  Delay: {
    id: "Delay",
    data: {
      type: "static",
      timeMs: 1000,
    },
  },
  Throttle: {
    id: "Throttle",
    data: {
      type: "static",
      timeMs: 1000,
    },
  },
  Interval: {
    id: "Interval",
    data: {
      type: "static",
      timeMs: 1000,
    },
  },
};

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

  // migrate old stdlib nodes
  for (const ins of data.node?.instances) {
    if (isRefNodeInstance(ins as NodeInstance) && !ins.macroId) {
      const migration = macroMigrationsMap[ins.nodeId];
      if (macroMigrationsMap[ins.nodeId]) {
        ins.macroId = migration.id;
        ins.macroData = migration.data;

        const stdlibImports = (data.imports["@flyde/stdlib"] as string[]) ?? [];
        if (!stdlibImports.includes(migration.id)) {
          stdlibImports.push(migration.id);
          data.imports["@flyde/stdlib"] = stdlibImports;
        }
      }
    }
  }

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
