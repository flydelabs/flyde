import {
  ExecuteParams,
  FlydeFlow,
  ImportedPart,
  ResolvedDependencies,
  simplifiedExecute,
} from "@flyde/core";
import { deserializeFlowByPath, resolveDependencies } from "@flyde/resolver";
import EventEmitter = require("events");

import findRoot from "find-root";
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

const calcImplicitRoot = (fnName: string) => {
  const callPath = getCallPath(fnName);
  return findRoot(callPath);
};

export function loadFlowFromContent<Inputs>(
  flow: FlydeFlow,
  fullFlowPath: string,
  debuggerUrl: string
): LoadedFlowExecuteFn<Inputs> {
  const deps = resolveDependencies(
    flow,
    "implementation",
    fullFlowPath
  ) as ResolvedDependencies;

  const mainPart: ImportedPart = {
    ...flow.part,
    source: { path: fullFlowPath, export: "n/a" },
  }; // TODO - fix the need for imported visual parts to declare an export source.

  deps[mainPart.id] = mainPart;

  return (inputs, params = {}) => {
    const { onOutputs, ...otherParams } = params;
    debugLogger("Executing flow %s", params);

    let destroy;
    const promise: any = new Promise(async (res, rej) => {
      const _debugger =
        otherParams._debugger ||
        (await createDebugger(debuggerUrl, fullFlowPath));

      debugLogger("Using debugger %o", _debugger);
      destroy = await simplifiedExecute(
        flow.part,
        deps,
        inputs || {},
        onOutputs,
        {
          _debugger: _debugger,
          onCompleted: (data) => {
            void (async function () {
              if (_debugger && _debugger.destroy) {
                await _debugger.destroy();
              }
              res(data);
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
