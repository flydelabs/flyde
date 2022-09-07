import { NativePart, partInput, partOutput } from "@flyde/core";
import { readFileSync } from "fs";
import { resolveFlowPath } from "./resolve-flow-path";
import { resolveFlow } from "./resolver/resolve-flow";
import { deserializeFlow } from "./serdes";
import { simplifiedExecute } from "./simplified-execute";

export * from "./serdes";
export * from './resolver';

const exposed = {};

export const expose = (functionality: any, name: string, inputs?: string[]) => {
  console.log(`exposing ${name}`);
  exposed[name] = functionality;
};

export const executeFlowResolved = async (
  flowPath: string,
  _inputs: Record<string, any>,
  flowNameToRun: string = "Main"
): Promise<any> => {
  const path = resolveFlowPath(flowPath);
  const resolved = resolveFlow(path, "implementation");

  const flowToRun = resolved[flowNameToRun];
  return simplifiedExecute(flowToRun, resolved, _inputs);
};

export const executeFlow = async (flowPath: string, inputs: Record<string, any>): Promise<any> => {
  const path = resolveFlowPath(flowPath);
  const flow = deserializeFlow(readFileSync(path, "utf8"), path);
  const parts = resolveFlow(path, "implementation");
  const main = parts.Main;

  if (!main) {
    throw new Error("No Main part found");
  }
  const exposedFunc = flow.exposedFunctionality || [];

  for (const func of exposedFunc)  {
    const _inputs = func.inputs || ["args"];
    const inputs = _inputs.reduce((acc, curr) => {
      return { ...acc, [curr]: partInput("any") };
    }, {});
    const part: NativePart = {
      id: func.displayName,
      inputs,
      outputs: { result: partOutput("any") },
      completionOutputs: ["result"],
      fn: (inputs, outputs, adv) => {
        const exposedFn = exposed[func.displayName];
        
        if (!exposedFn) {
          throw new Error(`Functionality ${func.displayName} not exposed`);
        }
        const args = _inputs.map((i) => inputs[i]);
        const result = exposedFn(...args);
        if (result.then && result.catch) {
          result
            .then((r) => outputs.result.next(r))
            .catch((e) => adv.onError(e))
        } else {
          outputs.result.next(result);
        }
      }
    }
    parts[part.id] = part;
  }

  return simplifiedExecute(main, { ...parts }, inputs, { exposed });
};
