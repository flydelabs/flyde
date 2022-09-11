import { NativePart, partInput, partOutput } from "@flyde/core";
import { readFileSync } from "fs";
import { resolveFlowPath } from "./resolve-flow-path";
import { resolveFlow } from "./resolver/resolve-flow";
import { deserializeFlow } from "./serdes";
import { simplifiedExecute } from "./simplified-execute";

export * from "./serdes";
export * from './resolver';

export const executeFlowResolved = async (
  flowPath: string,
  _inputs: Record<string, any>,
  flowNameToRun: string = "Main"
): Promise<any> => {
  const path = resolveFlowPath(flowPath);
  const resolved = resolveFlow(path, "implementation");

  const flowToRun = resolved[flowNameToRun];
  return simplifiedExecute(flowToRun, resolved, _inputs);
};

export const executeFlow = async (flowPath: string, inputs: Record<string, any>): Promise<any> => {
  const path = resolveFlowPath(flowPath);
  const flow = deserializeFlow(readFileSync(path, "utf8"), path);
  const parts = resolveFlow(path, "implementation");
  const main = parts.Main;

  if (!main) {
    throw new Error("No Main part found");
  }

  return simplifiedExecute(main, { ...parts }, inputs, { });
};
