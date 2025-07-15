import { ExecuteParams, FlydeFlow, simplifiedExecute, reportEvent } from "@flyde/core";
import { resolveVisualNode } from "../resolver";
import { createServerReferencedNodeFinder } from "../resolver/server/findReferencedNodeServer";
import { deserializeFlowByPath } from "../serdes";
import EventEmitter = require("events");

import findRoot from "find-root";
import { join } from "path";
import { createDebugger } from "./create-debugger";

import { getCallPath } from "./get-call-path";
import { debugLogger } from "./logger";

// Generate anonymous ID for telemetry
const generateAnonymousId = () => 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Analyze flow for telemetry
const analyzeFlow = (flow: FlydeFlow) => {
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

// convenience exports
export { InternalCodeNode, BaseNode, VisualNode } from "@flyde/core";

// debugger exports
export * from "./debugger";

export type PromiseWithEmitter<T> = Promise<T> & { on: EventEmitter["on"] };

export type LoadedFlowExecuteFn<Inputs> = (
  inputs?: Inputs,
  extraParams?: Partial<
    ExecuteParams & { onOutputs?: (key: string, data: any) => void } & {
      executionDelay?: number;
    }
  >
) => {
  result: Promise<Record<string, any>>;
  destroy: () => void;
};

const calcImplicitRoot = (fnName: string) => {
  const callPath = getCallPath(fnName);
  return findRoot(callPath);
};

export function loadFlowFromContent<Inputs>(
  flow: FlydeFlow,
  fullFlowPath: string,
  debuggerUrl: string,
  secrets: Record<string, string> = {}
): LoadedFlowExecuteFn<Inputs> {
  const findReferencedNode = createServerReferencedNodeFinder(fullFlowPath);
  const node = resolveVisualNode(flow.node, findReferencedNode, secrets);

  return (inputs, params = {}) => {
    const userId = generateAnonymousId();
    const startTime = Date.now();
    
    const { onOutputs, onCompleted, ...otherParams } = params;
    debugLogger("Executing flow %s", params);

    // Analyze flow and report start
    const flowAnalysis = analyzeFlow(flow);
    reportEvent(userId, 'loadFlow:start', flowAnalysis);

    let destroy;
    const promise: any = new Promise(async (res, rej) => {
      try {
        const _debugger =
          otherParams._debugger ||
          (await createDebugger(
            debuggerUrl,
            fullFlowPath,
            params.executionDelay
          ));

        debugLogger("Using debugger %o", _debugger);
        destroy = await simplifiedExecute(node, inputs ?? {}, onOutputs, {
          _debugger: _debugger,
          onCompleted: (data) => {
            void (async function () {
              if (_debugger && _debugger.destroy) {
                await _debugger.destroy();
              }
              console.log("onCompleted", data);
              
              // Report success
              const duration = Date.now() - startTime;
              reportEvent(userId, 'loadFlow:success', { duration });
              
              res(data);
              if (onCompleted) {
                onCompleted(data);
              }
            })();
          },
          onBubbleError: (err) => {
            // Report error
            const duration = Date.now() - startTime;
            reportEvent(userId, 'loadFlow:error', {
              duration,
              errorMessage: err instanceof Error ? err.message : 'Unknown error'
            });
            
            rej(err);
          },
          ...otherParams,
        });
      } catch (error) {
        // Report error
        const duration = Date.now() - startTime;
        reportEvent(userId, 'loadFlow:error', {
          duration,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        
        rej(error);
      }
    }) as any;
    return { result: promise, destroy };
  };
}

export function loadFlowByPath<Inputs>(
  relativePath: string,
  root?: string,
  secrets?: Record<string, string>
): LoadedFlowExecuteFn<Inputs> {
  const _root = root || calcImplicitRoot("loadFlowByPath");
  const flowPath = join(_root, relativePath);
  const flow = deserializeFlowByPath(flowPath);

  return loadFlowFromContent(flow, flowPath, "http://localhost:8545", secrets);
}

export function loadFlow<Inputs>(
  flowOrPath: FlydeFlow | string,
  root?: string,
  secrets?: Record<string, string>
): LoadedFlowExecuteFn<Inputs> {
  const _root = root || calcImplicitRoot("loadFlow");
  if (typeof flowOrPath === "string") {
    return loadFlowByPath(flowOrPath, _root, secrets);
  } else {
    return loadFlowFromContent(flowOrPath, _root, "http://localhost:8545", secrets);
  }
}
