import { FlydeFlow, ResolvedFlydeFlow } from "@flyde/core";
import _ = require("lodash");
import { deserializeFlowByPath } from "../serdes/deserialize";
import { resolveFlow } from "./resolve-dependencies/resolve-dependencies";

export type ResolveMode = "implementation" | "definition";

export function resolveFlowDependencies(
  flow: FlydeFlow,
  flowPath: string,
  mode: ResolveMode = "definition"
): ResolvedFlydeFlow {
  return resolveFlow(flow, mode, flowPath);
}

function _resolveFlow(
  fullFlowPath: string,
  mode: ResolveMode = "definition"
): ResolvedFlydeFlow {
  const flow = deserializeFlowByPath(fullFlowPath);
  return resolveFlowDependencies(flow, fullFlowPath, mode);
}

export const resolveFlowByPath = _resolveFlow;
