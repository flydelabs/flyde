import { join } from "path";
import { runNode, RunNodeOptions } from "@flyde/core";
import { resolveVisualNode } from "./resolver";
import { createServerReferencedNodeFinder } from "./resolver/server/findReferencedNodeServer";
import { deserializeFlowByPath } from "./serdes";
import { createDebugger } from "./runtime/create-debugger";
import { detectProjectRoot } from "./auto-root";

// Expose all existing features from loadFlowFromContent
export interface RunFlowOptions extends RunNodeOptions {
  root?: string;
  secrets?: Record<string, string>;
  debuggerUrl?: string; // defaults to "http://localhost:8545" if not provided
}

// Main new API - returns outputs directly
export async function runFlow<TInputs = any, TOutputs = any>(
  flowPath: string,
  inputs: TInputs,
  options?: RunFlowOptions
): Promise<TOutputs> {
  const { root, secrets, debuggerUrl = "http://localhost:8545", ...runNodeOptions } = options || {};
  
  const _root = root || detectProjectRoot("runFlow");
  const fullPath = join(_root, flowPath);
  const flow = deserializeFlowByPath(fullPath);
  
  const findReferencedNode = createServerReferencedNodeFinder(fullPath);
  const node = resolveVisualNode(flow.node, findReferencedNode, secrets || {});
  
  // Create debugger if needed (only if not already provided)
  const _debugger = runNodeOptions._debugger || 
    (debuggerUrl ? await createDebugger(debuggerUrl, fullPath, runNodeOptions.executionDelay) : undefined);
  
  return runNode<TInputs, TOutputs>(node, inputs, {
    ...runNodeOptions,
    _debugger
  });
}