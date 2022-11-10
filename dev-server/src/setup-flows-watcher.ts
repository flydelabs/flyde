import { FlydeFlow } from "@flyde/core";
import { readFileSync } from "fs";
import { join } from "path";
import * as chokidar from "chokidar";
import { deserializeFlow } from "@flyde/resolver";

export type Corrupt = "corrupt";

export type FlowsMap = Map<string, FlydeFlow | Corrupt>;
export const setupFlowsWatcher = (rootDir: string, onFlowsChange: (map: FlowsMap) => void) => {
  const flows: FlowsMap = new Map<string, FlydeFlow | Corrupt>();
  // One-liner for current directory
  chokidar
    .watch(["**/*.flyde"], { cwd: rootDir, ignored: "node_modules" })
    .on("all", (event, path) => {
      switch (event) {
        case "add":
        case "change":
          {
            try {
              const flowPath = join(rootDir, path);
              const contents = readFileSync(flowPath, "utf8");
              try {
                const flow = deserializeFlow(contents, flowPath);
                flows.set(path, flow);
              } catch (e) {
                flows.set(path, "corrupt");
              }
            } catch (e) {
              console.error(`Error parsing flow file ${path}: ${e}`);
              flows.set(path, "corrupt");
            }
            onFlowsChange(flows);
          }
          break;
        case "unlink": {
          flows.delete(path);
          onFlowsChange(flows);
          break;
        }
        case "unlinkDir": {
          const matchingFlows = Array.from(flows.entries()).filter(([key, value]) =>
            key.startsWith(path)
          );
          matchingFlows.forEach(([key, value]) => flows.delete(key));
          onFlowsChange(flows);
        }
      }
    });
};
