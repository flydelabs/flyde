import { FlydeFlow, ResolvedFlydeFlow } from "@flyde/core";
import _ = require("lodash");
import { deserializeFlowByPath } from "../serdes/deserialize";
import { resolveFlow } from "./resolve-dependencies/resolve-dependencies";

export function resolveFlowDependencies(
  flow: FlydeFlow,
  flowPath: string
): ResolvedFlydeFlow {
  return resolveFlow(flow, flowPath);
}

function _resolveFlow(fullFlowPath: string): ResolvedFlydeFlow {
  const flow = deserializeFlowByPath(fullFlowPath);

  return resolveFlowDependencies(flow, fullFlowPath);
}

export const resolveFlowByPath = _resolveFlow;
