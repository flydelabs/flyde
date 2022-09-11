import { dynamicOutput, execute, keys, Part, PartRepo, staticPartInput } from "@flyde/core";
import { createDebugger } from "./create-debugger";

export const simplifiedExecute = async (partToRun: Part, repo: PartRepo, inputs: Record<string, any>, extraContext: any = {}) => {
   (global as any).vm2 = require("vm2");
   try {
    const output = dynamicOutput();
    const outputName = keys(partToRun.outputs)[0]; 
  
    const _inputs = Object.keys(inputs).reduce((acc, curr) => {
      return {
        ...acc,
        [curr]: staticPartInput(inputs[curr]),
      };
    }, {});

    const _debugger = await createDebugger();
    return new Promise((res, rej) => {
      output.subscribe((data) => {
        res(data);
      });
      execute({
        part: partToRun,
        inputs: _inputs,
        outputs: { [outputName]: output },
        partsRepo: repo,
        _debugger,
        extraContext,
        onBubbleError: rej
      });
    });
  } catch (e) {
    return Promise.reject(new Error(`Error while executing flow: ${e.message}`));
  }
}