import { AppData, AppFileType } from "@/components/AppView";

import {
  ResolvedDependencies,
  simplifiedExecute,
  Debugger,
  isBaseNode,
  DynamicNodeInput,
  isMacroNode,
} from "@flyde/core";

import * as stdlib from "@flyde/stdlib/dist/all-browser";
import { transpileFile } from "../transpileFile/transpileFile";
import React from "react";
import ReactDOM from "react-dom";
import { processMacroNodes } from "@/components/EmbeddedFlyde/macroHelpers";

function ensureFakeModulesOnWindow(
  app: AppData,
  deps: ResolvedDependencies,
  _debugger: Debugger,
  handle: PlaygroundHandle
) {
  const windowAny = window as any;

  windowAny.React = windowAny.React || React;
  windowAny.ReactDOM = windowAny.ReactDOM || ReactDOM;

  const fakeRuntime = {
    loadFlow: (path: string) => {
      const maybeFile = app.files.find(
        (file) => file.name + "." + file.type === path
      );

      if (!maybeFile) {
        throw new Error(`Flow not found: ${path}`);
      }

      const flow = JSON.parse(maybeFile.content);

      const onStatusChange: (status: RuntimeStatus) => void =
        windowAny.__onStatusChange;

      return (inputs: any, params: any = {}) => {
        const { onOutputs, ...otherParams } = params;

        let destroy: ReturnType<typeof simplifiedExecute>;
        const promise: any = new Promise(async (res, rej) => {
          const fixedStdlib = Object.entries(stdlib).reduce(
            (acc, [key, val]) => {
              if (isBaseNode(val) || isMacroNode(val)) {
                acc[val.id] = val;
                return acc;
              } else {
                return acc;
              }
            },
            {} as any
          );

          const { newDeps, newNode } = processMacroNodes(flow.node, {
            ...fixedStdlib,
            ...deps,
          });

          onStatusChange({ type: "running" });
          destroy = await simplifiedExecute(
            newNode,
            { ...fixedStdlib, ...deps, ...newDeps } as any,
            inputs ?? handle.inputs,
            onOutputs,
            {
              _debugger,
              onCompleted: (data) => {
                void (async function () {
                  onStatusChange({ type: "stopped" });
                  res(data);
                })();
              },
              onBubbleError: (err) => {
                onStatusChange({ type: "error", error: err });
                // rej(err);
              },
              ...otherParams,
            }
          );

          windowAny.__destroyExecution = function () {
            destroy();
            onStatusChange({ type: "stopped" });
          };
        }) as any;
        return { result: promise, destroy };
      };
    },
  };

  windowAny.__modules = {
    ["@flyde/runtime"]: fakeRuntime,
  };
}

export function destroyExecution() {
  const windowAny = window as any;
  if (!windowAny.__destroyExecution) {
    throw new Error("No execution to destroy");
  }
  windowAny.__destroyExecution();
}

export interface PlaygroundHandle {
  setMode: (mode: "string" | "jsx") => void;
  addOutput: (key: string, output: any) => void;
  inputs: Record<string, DynamicNodeInput>;
}

export type RuntimeStatus =
  | RuntimeStatusStopped
  | RuntimeStatusRunning
  | RuntimeStatusError;

export interface RuntimeStatusStopped {
  type: "stopped";
}

export interface RuntimeStatusRunning {
  type: "running";
}

export interface RuntimeStatusError {
  type: "error";
  error: any;
}

export interface ExecuteAppParams {
  app: AppData;
  deps: ResolvedDependencies;
  _debugger: Debugger;
  playgroundHandle: PlaygroundHandle;
  debugDelay: number;
  onStatusChange: (status: RuntimeStatus) => void;
}

export function executeApp({
  app,
  _debugger,
  deps,
  playgroundHandle: outputHandle,
  debugDelay,
  onStatusChange,
}: ExecuteAppParams) {
  (window as any).__onStatusChange = onStatusChange;

  if (debugDelay) {
    _debugger.debugDelay = debugDelay;
  } else {
    _debugger.debugDelay = undefined;
  }
  ensureFakeModulesOnWindow(app, deps, _debugger, outputHandle);

  (window as any).FlydePlayground = outputHandle;

  const entry = app.files.find((file) => file.type === AppFileType.ENTRY_POINT);

  if (!entry) {
    throw new Error("No entry point found");
  }

  const transpileOutput = transpileFile(
    entry.name + "." + entry.type,
    entry.content
  );

  const codeToRun = `async () => {
    ${transpileOutput}
  }`;

  eval(codeToRun)();
}
