import { PlaygroundFile } from './types';
import { transpileFile } from './transpileFile/transpileFile';
import { simplifiedExecute, Debugger, isCodeNode, DynamicNodeInput, replaceInputsInValue, configurableValue, extractInputsFromValue } from '@flyde/core';
import * as stdlib from '@flyde/nodes/dist/all-browser';
import { OpenAIStub, AnthropicStub } from '../../components/llm-stubs';
import React from 'react';
import ReactDOM from 'react-dom';
import { resolveVisualNode } from '@flyde/loader/browser';
import { customCodeNodeFromCode } from '@flyde/core/dist/misc/custom-code-node-from-code';

export interface PlaygroundHandle {
  setMode: (mode: "string" | "jsx") => void;
  addOutput: (key: string, output: any) => void;
  inputs: Record<string, DynamicNodeInput>;
}

export type RuntimeStatus =
  | { type: "stopped" }
  | { type: "running" }
  | { type: "error"; error: any };

export interface RunPlaygroundParams {
  files: PlaygroundFile[];
  onStatusChange: (status: RuntimeStatus) => void;
  onOutput?: (output: any) => void;
  debugger?: Debugger;
  secrets?: Record<string, string>;
}

// Create a browser-compatible node resolver
function createBrowserNodeFinder(files: PlaygroundFile[], secrets: Record<string, string> = {}) {
  // Get all available code nodes
  const codeNodes: any = {};

  // Add LLM stubs first
  codeNodes['OpenAI'] = OpenAIStub;
  codeNodes['Anthropic'] = AnthropicStub;

  // Add stdlib nodes
  Object.entries(stdlib).forEach(([key, val]) => {
    if (isCodeNode(val)) {
      codeNodes[val.id] = val;
    }
  });

  // Add custom code nodes from .flyde.ts files
  const tsFiles = files.filter(f => f.name.endsWith('.flyde.ts'));
  for (const tsFile of tsFiles) {
    const customNode = customCodeNodeFromCode(tsFile.content, undefined, {
      "@flyde/core": {
        configurableValue: configurableValue,
        extractInputsFromValue: extractInputsFromValue,
        replaceInputsInValue: replaceInputsInValue,
      },
    });
    codeNodes[customNode.id] = customNode;
  }

  return (instance: any) => {
    const { type, source, nodeId } = instance;
    // Debug logging available if needed:
    // console.log('[DEBUG] Looking for node:', nodeId, 'Instance type:', type, 'Source:', source);
    // console.log('[DEBUG] Available nodes:', Object.keys(codeNodes));

    // Check if it's a package node from @flyde/nodes
    if (type === "code" && source?.type === "package" && source?.data === "@flyde/nodes") {
      // Use LLM stubs for OpenAI and Anthropic
      if (nodeId === "OpenAI") {
        return OpenAIStub;
      }
      if (nodeId === "Anthropic") {
        return AnthropicStub;
      }
    }

    const found = codeNodes[nodeId];
    if (!found) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    return found;
  };
}


export function setupFakeRuntime(files: PlaygroundFile[], onStatusChange: (status: RuntimeStatus) => void, _debugger?: Debugger, secrets: Record<string, string> = {}) {
  const windowAny = window as any;

  // Setup React globals
  windowAny.React = windowAny.React || React;
  windowAny.ReactDOM = windowAny.ReactDOM || ReactDOM;

  // Create node finder for this set of files
  const findReferencedNode = createBrowserNodeFinder(files, secrets);

  // Create fake @flyde/loader runtime
  const fakeRuntime = {
    loadFlow: (path: string) => {
      // Clean up path
      const cleanPath = path.replace('./', '');


      // Find the flow file in the current files array
      const maybeFile = files.find(
        (file) => file.name === cleanPath || file.name === cleanPath.replace('.flyde', '') + '.flyde'
      );

      if (!maybeFile) {
        throw new Error(`Flow not found: ${path}`);
      }

      // Parse the flow - always use the current file content
      let flow;
      try {
        flow = JSON.parse(maybeFile.content);
      } catch (e) {
        throw new Error(`Failed to parse flow ${path}: ${e}`);
      }

      // Return a function that can execute the flow
      return (inputs: any = {}, params: any = {}) => {
        const { onOutputs, ...otherParams } = params;

        return new Promise(async (resolve, reject) => {
          try {
            onStatusChange({ type: "running" });

            // Resolve the flow using the runtime resolver
            const resolvedFlow = resolveVisualNode(flow.node || flow, findReferencedNode, {});

            // Execute the resolved flow
            const outputs: Record<string, any> = {};
            const cancelFn = simplifiedExecute(
              resolvedFlow,
              inputs,
              (outputKey, outputData) => {
                outputs[outputKey] = outputData;
                if (onOutputs) onOutputs(outputKey, outputData);

                // For simple flows, try completing after first output
                setTimeout(() => {
                  onStatusChange({ type: "stopped" });
                  resolve(outputs);
                }, 100);
              },
              {
                onCompleted: (data) => {
                  onStatusChange({ type: "stopped" });
                  resolve(data);
                },
                onBubbleError: (err) => {
                  onStatusChange({ type: "error", error: err });
                  reject(err);
                },
                _debugger,
                extraContext: { secrets },
                ...otherParams,
              }
            );

          } catch (error) {
            onStatusChange({ type: "error", error });
            reject(error);
          }
        });
      };
    },

    runFlow: async (path: string, inputs: any = {}) => {
      const flowFn = fakeRuntime.loadFlow(path);
      return flowFn(inputs);
    }
  };

  // Setup the fake module system
  windowAny.__modules = {
    ...windowAny.__modules,
    ["@flyde/loader"]: fakeRuntime,
    ["@flyde/runtime"]: fakeRuntime, // alias
  };

  return fakeRuntime;
}

export interface RunPlaygroundResult {
  promise: Promise<any>;
  stop: () => void;
}

export function runPlayground({
  files,
  onStatusChange,
  onOutput,
  debugger: providedDebugger,
  secrets = {}
}: RunPlaygroundParams): RunPlaygroundResult {
  let cancelled = false;
  let stopExecution: (() => void) | null = null;

  const promise = (async () => {
    try {
      // Setup the fake runtime
      setupFakeRuntime(files, onStatusChange, providedDebugger, secrets);

      // Find the entry point (index.ts)
      const entryFile = files.find(f => f.name === 'index.ts');
      if (!entryFile) {
        throw new Error('No index.ts entry point found');
      }

      // Transpile the entry file
      const transpiled = transpileFile(entryFile.name, entryFile.content);

      // Create execution context
      const windowAny = window as any;

      try {
        onStatusChange({ type: "running" });

        // Create scoped console that only captures user code output
        const userConsole = {
          log: (...args: any[]) => {
            if (cancelled) return;
            if (onOutput) {
              onOutput({ type: 'log', args });
            }
            console.log(...args); // Still show in browser console
          },
          error: (...args: any[]) => {
            if (cancelled) return;
            if (onOutput) {
              onOutput({ type: 'error', args });
            }
            console.error(...args); // Still show in browser console
          }
        };

        // Store the destroy function if available
        stopExecution = () => {
          if (windowAny.__destroyExecution) {
            windowAny.__destroyExecution();
          }
        };

        // Execute the transpiled code with scoped console
        const asyncExecutor = new Function('console', `
          return (async () => {
            ${transpiled}
          })();
        `);

        const result = await asyncExecutor(userConsole);

        if (!cancelled) {
          onStatusChange({ type: "stopped" });
        }

        return result;
      } catch (error) {
        if (!cancelled) {
          onStatusChange({ type: "error", error });
        }
        throw error;
      }

    } catch (error) {
      if (!cancelled) {
        onStatusChange({ type: "error", error });
      }
      throw error;
    }
  })();

  return {
    promise,
    stop: () => {
      cancelled = true;
      if (stopExecution) {
        stopExecution();
      }
      onStatusChange({ type: "stopped" });
    }
  };
}