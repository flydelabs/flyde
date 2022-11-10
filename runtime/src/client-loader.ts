import { ResolvedFlydeRuntimeFlow, simplifiedExecute, noop } from "@flyde/core";
import type { LoadedFlowExecuteFn } from ".";
import { createDebugger } from "./create-debugger";

export const loadClientFlow = <Inputs>(resolvedFlow: ResolvedFlydeRuntimeFlow): LoadedFlowExecuteFn<Inputs> => {

    return async (inputs, params = {}) => {
      const { onOutputs, ...otherParams} = params;
      const _debugger = await createDebugger();
      return simplifiedExecute(resolvedFlow.main, resolvedFlow.dependencies, inputs, onOutputs || noop, {_debugger: _debugger, ...otherParams});
    };
  };
  