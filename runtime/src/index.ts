import { ExecuteParams, FlydeFlow, noop, ResolvedFlydeRuntimeFlow, simplifiedExecute } from "@flyde/core";
import { resolveFlow } from "@flyde/resolver";
import { create } from "domain";
import EventEmitter = require("events");

import  * as findRoot from 'find-root';
import { join } from "path";
import { createDebugger } from "./create-debugger";
// import { EventPromise } from "./events-promise";
import { getCallPath } from "./get-call-path";


export type PromiseWithEmitter<T> = Promise<T> & {on: EventEmitter['on']};

// export const 

export type LoadedFlowExecuteFn<Inputs> = (
  inputs?: Inputs,
  extraParams?: Partial<ExecuteParams & {onOutputs?: (key: string, data: any) => void}>
) => Promise<Record<string, any>>;


const calcImplicitRoot = () => {
  const callPath = getCallPath();
  return findRoot(callPath);
}

export const loadFlow = <Inputs>(relativePath: string, root?: string): LoadedFlowExecuteFn<Inputs> => {
  const _root = root || calcImplicitRoot();
  const flowPath = join(_root, relativePath)
  const resFlow = resolveFlow(flowPath, "implementation") as ResolvedFlydeRuntimeFlow;
  const main = resFlow.main;

  if (!main) {
    throw new Error("No Main part found");
  }


  return async (inputs, params = {}) => {

    const { onOutputs, ...otherParams} = params;


    const _debugger = otherParams._debugger || await createDebugger();
    // console.log(_debugger);
    

    const promise: any = new Promise(async (res, rej) => {
      const clean = await simplifiedExecute(main, resFlow.dependencies, inputs || {}, onOutputs, {_debugger: _debugger, onCompleted: (data) => {

          // allow debugger to finish it's thing
          setImmediate(() => {
            if (_debugger.destroy) {
            _debugger.destroy();
            };
            res(data);
          });

      }, ...otherParams});


    }) as any;
    return promise;
  };
};
