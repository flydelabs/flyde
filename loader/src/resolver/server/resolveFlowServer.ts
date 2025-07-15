import { InternalVisualNode } from "@flyde/core";
import _ = require("lodash");
import { deserializeFlowByPath } from "../../serdes";
import { resolveVisualNode } from "../resolveVisualNode";
import { VisualNode } from "@flyde/core";
import { createServerReferencedNodeFinder } from "./findReferencedNodeServer";

function _resolveFlow(fullFlowPath: string, secrets: Record<string, string> = {}): InternalVisualNode {
  const flow = deserializeFlowByPath(fullFlowPath);
  return resolveFlowServer(flow.node, fullFlowPath, secrets);
}

export function resolveFlowServer(
  node: VisualNode,
  flowPath: string,
  secrets: Record<string, string> = {}
): InternalVisualNode {
  const nodeFinder = createServerReferencedNodeFinder(flowPath);
  return resolveVisualNode(node, nodeFinder, secrets);
}

export const resolveFlowByPath = _resolveFlow;
