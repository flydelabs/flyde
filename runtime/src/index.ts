import { ExecuteParams, FlydeFlow, noop, ResolvedFlydeRuntimeFlow, simplifiedExecute } from "@flyde/core";
import { resolveFlow } from "@flyde/resolver";

import  * as findRoot from 'find-root';
import { join } from "path";
import { createDebugger } from "./create-debugger";
import { getCallPath } from "./get-call-path";


export type LoadedFlowExecuteFn<Inputs> = (
  inputs: Inputs,
  extraParams?: Partial<ExecuteParams & {onOutputs?: (key: string, data: any) => void}>
) => Promise<unknown>;


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
    const _debugger = await createDebugger();
    return simplifiedExecute(main, resFlow.dependencies, inputs, onOutputs || noop, {_debugger: _debugger, ...otherParams});
  };
};
