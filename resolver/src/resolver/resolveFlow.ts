import { InternalVisualNode } from "@flyde/core";
import _ = require("lodash");
import { deserializeFlowByPath } from "../serdes/deserialize";
import { resolveVisualNode } from "./resolveVisualNode";
import { VisualNode } from "@flyde/core";

function _resolveFlow(fullFlowPath: string): InternalVisualNode {
  const flow = deserializeFlowByPath(fullFlowPath);
  return resolveFlow(flow.node, fullFlowPath);
}

export function resolveFlow(
  node: VisualNode,
  flowPath: string
): InternalVisualNode {
  return resolveVisualNode(node, flowPath);
}

export const resolveFlowByPath = _resolveFlow;
