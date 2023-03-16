import {
  ExecuteParams,
  FlydeFlow,
  ResolvedDependencies,
  simplifiedExecute,
} from "@flyde/core";
import { deserializeFlowByPath, resolveDependencies, resolveFlowDependencies, resolveFlowDependenciesByPath } from "@flyde/resolver";
import EventEmitter = require("events");

import * as findRoot from "find-root";
import { readFileSync } from "fs";
import { join } from "path";
import { createDebugger } from "./create-debugger";
// import { EventPromise } from "./events-promise";
import { getCallPath } from "./get-call-path";
import { debugLogger } from "./logger";

export type PromiseWithEmitter<T> = Promise<T> & { on: EventEmitter["on"] };

// export const

export type LoadedFlowExecuteFn<Inputs> = (
  inputs?: Inputs,
  extraParams?: Partial<
    ExecuteParams & { onOutputs?: (key: string, data: any) => void }
  >
) => {
  result: Promise<Record<string, any>>;
  destroy: () => void;
};

const calcImplicitRoot = () => {
  const callPath = getCallPath();
  return findRoot(callPath);
};

export function loadFlow<Inputs>(flow: FlydeFlow, fullFlowPath: string): LoadedFlowExecuteFn<Inputs> {
  const deps = resolveDependencies(flow, "implementation", fullFlowPath) as ResolvedDependencies;

  return (inputs, params = {}) => {
    const { onOutputs, ...otherParams } = params;
    debugLogger("Executing flow %s", params)

    let destroy;
    const promise: any = new Promise(async (res, rej) => {
      const _debugger = otherParams._debugger || (await createDebugger());
    
      debugLogger("Using debugger %o", _debugger);
      destroy = await simplifiedExecute(
        flow.part,
        deps,
        inputs || {},
        onOutputs,
        {
          _debugger: _debugger,
          onCompleted: (data) => {
            // allow debugger to finish it's thing
            setImmediate(() => {
              if (_debugger && _debugger.destroy) {
                _debugger.destroy();
              }
              res(data);
            });
          },
          ...otherParams,
        }
      );
    }) as any;
    return {result: promise, destroy};
  };

}

export function loadFlowByPath<Inputs>(
  relativePath: string,
  root?: string
): LoadedFlowExecuteFn<Inputs> {
  const _root = root || calcImplicitRoot();
  const flowPath = join(_root, relativePath);
  const flow = deserializeFlowByPath(flowPath);

  return loadFlow(flow, flowPath);
};
