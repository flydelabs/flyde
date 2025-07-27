import { PlaygroundApp, PlaygroundFileType } from "../types";

import {
  simplifiedExecute,
  Debugger,
  isCodeNode,
  DynamicNodeInput,
} from "@flyde/core";

import * as stdlib from "@flyde/nodes/dist/all-browser";
import { transpileFile } from "../transpileFile/transpileFile";
import React from "react";
import ReactDOM from "react-dom";

function ensureFakeModulesOnWindow(
  app: PlaygroundApp,
  _debugger: Debugger,
  handle: PlaygroundHandle
) {
  const windowAny = window as any;

  windowAny.React = windowAny.React || React;
  windowAny.ReactDOM = windowAny.ReactDOM || ReactDOM;

  const fakeRuntime = {
    loadFlow: (path: string) => {
      const maybeFile = app.files.find(
        (file) => file.name === path || file.name + "." + file.type === path
      );

      if (!maybeFile) {
        throw new Error(`Flow not found: ${path}`);
      }

      const flow = JSON.parse(maybeFile.content);

      const onStatusChange: (status: RuntimeStatus) => void =
        windowAny.__onStatusChange;

      return (inputs: any, params: any = {}) => {
        const { onOutputs, ...otherParams } = params;

        let destroy: ReturnType<typeof simplifiedExecute> | undefined;
        const promise: any = new Promise(async (res, rej) => {
          const fixedStdlib = Object.entries(stdlib).reduce(
            (acc, [key, val]) => {
              if (isCodeNode(val)) {
                acc[val.id] = val;
                return acc;
              } else {
                return acc;
              }
            },
            {} as any
          );

          onStatusChange({ type: "running" });
          destroy = await simplifiedExecute(
            flow.node,
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
            if (destroy) destroy();
            onStatusChange({ type: "stopped" });
          };
        }) as any;
        return { 
          result: promise, 
          destroy: () => {
            if (destroy) destroy();
          }
        };
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
  app: PlaygroundApp;
  _debugger: Debugger;
  playgroundHandle: PlaygroundHandle;
  debugDelay: number;
  onStatusChange: (status: RuntimeStatus) => void;
}

export function executeApp({
  app,
  _debugger,
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
  ensureFakeModulesOnWindow(app, _debugger, outputHandle);

  (window as any).FlydePlayground = outputHandle;

  const entry = app.files.find((file) => file.name === 'index.ts');

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
