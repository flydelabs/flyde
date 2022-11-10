import EventEmitter = require("events");
import { Part, PartRepo, dynamicOutput, keys, staticPartInput, partOutput } from ".";
import { execute, ExecuteParams } from "./execute";

export const simplifiedExecute = async (
  partToRun: Part,
  repo: PartRepo,
  inputs: Record<string, any>,
  onOutput?: (key: string, data: any) => void,
  otherParams: Partial<ExecuteParams> = {}
) => {
  const outputKeys = keys(partToRun.outputs);

  const _inputs = Object.keys(inputs).reduce((acc, curr) => {
    return {
      ...acc,
      [curr]: staticPartInput(inputs[curr]),
    };
  }, {});
  
  // if (outputKeys.length === 1) {
  //   const output = dynamicOutput();
  //   try {
  //     const outputName = keys(partToRun.outputs)[0];

  //     return new Promise((res, rej) => {
  //       output.subscribe((data) => {
  //         res(data);
  //       });
  //       execute({
  //         part: partToRun,
  //         inputs: _inputs,
  //         outputs: { [outputName]: output },
  //         partsRepo: repo,
  //         onBubbleError: rej,
  //         ...otherParams,
  //       });
  //     });
  //   } catch (e) {
  //     return Promise.reject(new Error(`Error while executing flow: ${e.message}`));
  //   }
  // } else { 
    const outputs = outputKeys.reduce((acc, k) => {
      const output = dynamicOutput();
      output.subscribe((value) => {
        onOutput(k, value)
      });
      return {...acc, [k]: output}
    }, {});
  
    return execute({
      part: partToRun,
      inputs: _inputs,
      outputs,
      partsRepo: repo,
      onBubbleError: (err) => {throw err},
      ...otherParams,
    });
};
