import { FlydeFlow, ImportedNode, ResolvedFlydeFlow } from "@flyde/core";
import _ = require("lodash");
import { deserializeFlowByPath } from "../serdes/deserialize";
import { resolveDependencies } from "./resolve-dependencies/resolve-dependencies";

export type ResolveMode = "implementation" | "definition";

export function resolveFlowDependencies(
  flow: FlydeFlow,
  flowPath: string,
  mode: ResolveMode = "definition"
): ResolvedFlydeFlow {
  const dependencies = resolveDependencies(flow, mode, flowPath);

  return {
    main: flow.part,
    dependencies,
  };
}

function _resolveFlow(
  fullFlowPath: string,
  mode: ResolveMode = "definition"
): ResolvedFlydeFlow {
  const flow = deserializeFlowByPath(fullFlowPath);
  return resolveFlowDependencies(flow, fullFlowPath, mode);
}

export const resolveFlowDependenciesByPath = _resolveFlow;
