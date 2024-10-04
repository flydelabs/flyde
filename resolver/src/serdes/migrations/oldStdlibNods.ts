import { isRefNodeInstance, NodeInstance } from "@flyde/core";

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

export function migrateOldStdlibNodes(data: { node?: any; imports?: any }) {
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
}
