import { ResolvedFlydeRuntimeFlow } from "@flyde/core";
import { readFileSync } from "fs";
import { resolveFlowPath } from "./resolve-flow-path";
import { resolveFlow } from "./resolver/resolve-flow";
import { deserializeFlow } from "./serdes";
import { simplifiedExecute } from "./simplified-execute";

export * from "./serdes";
export * from './resolver';

export const executeFlow = async (flowPath: string, inputs: Record<string, any>): Promise<any> => {
  const path = resolveFlowPath(flowPath);
  const flow = deserializeFlow(readFileSync(path, "utf8"), path);
  const resFlow = resolveFlow(path, "implementation") as ResolvedFlydeRuntimeFlow;
  const main = resFlow.main;

  if (!main) {
    throw new Error("No Main part found");
  }

  return simplifiedExecute(main, resFlow.dependencies, inputs, { });
};
