import { FlydeFlow, InternalVisualNode } from "@flyde/core";
import _ = require("lodash");
import { deserializeFlowByPath } from "../serdes/deserialize";
import { resolveVisualNode } from "./resolve-dependencies/resolve-dependencies";
import { VisualNode } from "@flyde/core";

export function resolveFlowDependencies(
  node: VisualNode,
  flowPath: string
): InternalVisualNode {
  return resolveVisualNode(node, flowPath);
}

function _resolveFlow(fullFlowPath: string): InternalVisualNode {
  const flow = deserializeFlowByPath(fullFlowPath);
  return resolveFlowDependencies(flow.node, fullFlowPath);
}

export const resolveFlowByPath = _resolveFlow;
