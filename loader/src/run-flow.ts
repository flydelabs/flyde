import { join } from "path";
import { runNode, RunNodeOptions, reportEvent } from "@flyde/core";
import { resolveVisualNode } from "./resolver";
import { createServerReferencedNodeFinder } from "./resolver/server/findReferencedNodeServer";
import { deserializeFlowByPath } from "./serdes";
import { createDebugger } from "./runtime/create-debugger";
import { detectProjectRoot } from "./auto-root";

// Generate anonymous ID for telemetry
const generateAnonymousId = () => 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Analyze flow for telemetry
const analyzeFlow = (flow: any) => {
  const instances = flow.node.instances || {};
  const connections = flow.node.connections || [];
  const inputs = flow.node.inputs || {};
  const outputs = flow.node.outputs || {};
  
  const distinctNodes = new Set();
  Object.values(instances).forEach((instance: any) => {
    if (instance.nodeId) {
      distinctNodes.add(instance.nodeId);
    }
  });

  return {
    instancesCount: Object.keys(instances).length,
    connectionsCount: connections.length,
    distinctNodesCount: distinctNodes.size,
    inputsCount: Object.keys(inputs).length,
    outputsCount: Object.keys(outputs).length
  };
};

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
  const userId = generateAnonymousId();
  const startTime = Date.now();
  
  const { root, secrets, debuggerUrl = "http://localhost:8545", ...runNodeOptions } = options || {};
  
  const _root = root || detectProjectRoot("runFlow");
  const fullPath = join(_root, flowPath);
  const flow = deserializeFlowByPath(fullPath);
  
  // Analyze flow and report start
  const flowAnalysis = analyzeFlow(flow);
  reportEvent(userId, 'runFlow:start', flowAnalysis);
  
  try {
    const findReferencedNode = createServerReferencedNodeFinder(fullPath);
    const node = resolveVisualNode(flow.node, findReferencedNode, secrets || {});
    
    // Create debugger if needed (only if not already provided)
    const _debugger = runNodeOptions._debugger || 
      (debuggerUrl ? await createDebugger(debuggerUrl, fullPath, runNodeOptions.executionDelay) : undefined);
    
    const result = await runNode<TInputs, TOutputs>(node, inputs, {
      ...runNodeOptions,
      _debugger
    });
    
    // Report success
    const duration = Date.now() - startTime;
    reportEvent(userId, 'runFlow:success', { duration });
    
    return result;
  } catch (error) {
    // Report error
    const duration = Date.now() - startTime;
    reportEvent(userId, 'runFlow:error', {
      duration,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}