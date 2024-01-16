import {
  ExecuteParams,
  FlydeFlow,
  ResolvedDependencies,
  simplifiedExecute,
} from "@flyde/core";
import { deserializeFlowByPath, resolveFlow } from "@flyde/resolver";
import EventEmitter = require("events");

import findRoot from "find-root";
import { join } from "path";
import { createDebugger } from "./create-debugger";

import { getCallPath } from "./get-call-path";
import { debugLogger } from "./logger";

// convenience exports
export { CodeNode, BaseNode, VisualNode } from "@flyde/core";

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
  debuggerUrl: string
): LoadedFlowExecuteFn<Inputs> {
  const resFlow = resolveFlow(flow, "implementation", fullFlowPath);

  return (inputs, params = {}) => {
    const { onOutputs, onCompleted, ...otherParams } = params;
    debugLogger("Executing flow %s", params);

    let destroy;
    const promise: any = new Promise(async (res, rej) => {
      const _debugger =
        otherParams._debugger ||
        (await createDebugger(
          debuggerUrl,
          fullFlowPath,
          params.executionDelay
        ));

      debugLogger("Using debugger %o", _debugger);
      destroy = await simplifiedExecute(
        resFlow.main,
        resFlow.dependencies as ResolvedDependencies,
        inputs ?? {},
        onOutputs,
        {
          _debugger: _debugger,
          onCompleted: (data) => {
            void (async function () {
              if (_debugger && _debugger.destroy) {
                await _debugger.destroy();
              }
              res(data);
              if (onCompleted) {
                onCompleted(data);
              }
            })();
          },
          onBubbleError: (err) => {
            rej(err);
          },
          ...otherParams,
        }
      );
    }) as any;
    return { result: promise, destroy };
  };
}

export function loadFlowByPath<Inputs>(
  relativePath: string,
  root?: string
): LoadedFlowExecuteFn<Inputs> {
  const _root = root || calcImplicitRoot("loadFlowByPath");
  const flowPath = join(_root, relativePath);
  const flow = deserializeFlowByPath(flowPath);

  return loadFlowFromContent(flow, flowPath, "http://localhost:8545");
}

export function loadFlow<Inputs>(
  flowOrPath: FlydeFlow | string,
  root?: string
): LoadedFlowExecuteFn<Inputs> {
  const _root = root || calcImplicitRoot("loadFlow");
  if (typeof flowOrPath === "string") {
    return loadFlowByPath(flowOrPath, _root);
  } else {
    return loadFlowFromContent(flowOrPath, _root, "http://localhost:8545");
  }
}
