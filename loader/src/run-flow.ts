import { join } from "path";
import { FlydeFlow, reportEvent, runNode, RunNodeOptions } from "@flyde/core";
import { detectProjectRoot } from "./auto-root";
import { resolveVisualNode } from "./resolver";
import { createServerReferencedNodeFinder } from "./resolver/server/findReferencedNodeServer";
import { validateAndRecoverFlowImports } from "./resolver/server/resolveMovedFileImport";
import { createDebugger } from "./runtime/create-debugger";
import { deserializeFlowByPath } from "./serdes";

// Configures project root resolution, secret injection, and remote debugger connectivity.
export interface RunFlowOptions extends RunNodeOptions {
  root?: string;
  secrets?: Record<string, string>;
  debuggerUrl?: string;
}

interface PreparedFlowExecution<TInputs> {
  fullPath: string;
  flow: FlydeFlow;
  inputs: TInputs;
  options: RunFlowOptions;
}

const generateAnonymousId = () =>
  "user_" +
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

const analyzeFlow = (flow: FlydeFlow) => {
  const instances = flow.node.instances || [];
  const connections = flow.node.connections || [];
  const inputs = flow.node.inputs || {};
  const outputs = flow.node.outputs || {};

  const distinctNodes = new Set<string>();
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
    outputsCount: Object.keys(outputs).length,
  };
};

// Validates flow imports, resolves node dependencies, and executes the visual flow.
export async function runFlow<TInputs = any, TOutputs = any>(
  flowPath: string,
  inputs: TInputs,
  ...optionalArgs: [options?: RunFlowOptions]
): Promise<TOutputs> {
  const options = optionalArgs[0] ?? {};
  const userId = generateAnonymousId();
  const startTime = Date.now();
  const prepared = prepareFlowExecution(flowPath, { inputs, options });

  reportEvent(userId, "runFlow:start", analyzeFlow(prepared.flow));

  try {
    const result = await executePreparedFlow<TInputs, TOutputs>(prepared);
    reportEvent(userId, "runFlow:success", {
      duration: Date.now() - startTime,
    });
    return result;
  } catch (error) {
    reportEvent(userId, "runFlow:error", {
      duration: Date.now() - startTime,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

function prepareFlowExecution<TInputs>(
  flowPath: string,
  params: { inputs: TInputs; options: RunFlowOptions }
): PreparedFlowExecution<TInputs> {
  const rootDir = params.options.root || detectProjectRoot("runFlow");
  const fullPath = join(rootDir, flowPath);
  const rawFlow = deserializeFlowByPath(fullPath);
  const flow = validateAndRecoverFlowImports(rawFlow, {
    fullFlowPath: fullPath,
    searchRoot: rootDir,
  });
  return {
    fullPath,
    flow,
    inputs: params.inputs,
    options: params.options,
  };
}

async function executePreparedFlow<TInputs, TOutputs>(
  prepared: PreparedFlowExecution<TInputs>
): Promise<TOutputs> {
  const {
    root: _root,
    secrets,
    debuggerUrl: _debuggerUrl,
    ...runNodeOptions
  } = prepared.options;

  const findReferencedNode = createServerReferencedNodeFinder(
    prepared.fullPath
  );
  const node = resolveVisualNode(
    prepared.flow.node,
    findReferencedNode,
    secrets || {}
  );
  const activeDebugger = await resolveFlowDebugger(prepared);

  return runNode<TInputs, TOutputs>(node, prepared.inputs, {
    ...runNodeOptions,
    _debugger: activeDebugger,
  });
}

async function resolveFlowDebugger(prepared: PreparedFlowExecution<any>) {
  if (prepared.options._debugger) {
    return prepared.options._debugger;
  }
  const effectiveUrl =
    "debuggerUrl" in prepared.options
      ? prepared.options.debuggerUrl
      : "http://localhost:8545";
  if (!effectiveUrl) {
    return undefined;
  }
  return createDebugger(
    effectiveUrl,
    prepared.fullPath,
    prepared.options.executionDelay
  );
}
