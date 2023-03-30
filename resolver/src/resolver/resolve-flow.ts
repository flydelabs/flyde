import { FlydeFlow, ImportedPart, ResolvedFlydeFlow } from "@flyde/core";
import _ = require("lodash");
import { deserializeFlowByPath } from "../serdes/deserialize";
import { resolveDependencies } from "./resolve-dependencies/resolve-dependencies";

export type ResolveMode = "implementation" | "definition";

export function resolveFlowDependencies(
  flow: FlydeFlow,
  flowPath: string,
  mode: ResolveMode = "definition"
): ResolvedFlydeFlow {
  const deps = resolveDependencies(flow, mode, flowPath);

  const mainPart: ImportedPart = {
    ...flow.part,
    source: { path: flowPath, export: "n/a" },
  }; // TODO - fix the need for imported visual parts to declare an export source.
  return {
    main: flow.part,
    dependencies: { ...deps, [mainPart.id]: mainPart },
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
