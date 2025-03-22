// // ```
// import {
//   BaseNode,
//   InternalCodeNode,
//   InputNodePin,
//   OutputNodePin,
//   NodeStyleSize,
//   RunNodeFunction,
// } from ".";
// import { InputMode } from "./node-pins";

// // An improved type for the inputs object. It uses dynamic keys to allow the object properties to match the input names.
// type ImprovedInputs = {
//   [key: string]: InputNodePin<any>;
// };

// type Output = {
//   [key: string]: {
//     description: string;
//     next: (value?: any) => void;
//   };
// };

// export type SimpleFnData = Omit<BaseNode, "inputs" | "outputs" | "run"> & {
//   id: string;
//   description: string;
//   namespace: string;
//   inputs?: {
//     name: string;
//     description: string;
//     mode?: InputMode;
//     defaultValue?: any;
//   }[];
//   output?: {
//     name: string;
//     description: string;
//   };
//   run?: (...args: any[]) => any;
//   symbol?: string;
//   icon?: string;
//   size?: NodeStyleSize;
//   customViewCode?: string;
//   fullRunFn?: RunNodeFunction;
// };

// // This is the refactored nodeFromSimpleFunction function.
// export function nodeFromSimpleFunction(data: SimpleFnData): InternalCodeNode {
//   const inputs: ImprovedInputs = {}; // Using the improved inputs type defined above.
//   const outputs: Output = {};

//   // Converting the inputs array defined in the data parameter to the ImprovedInputs object format.
//   if (data.inputs) {
//     data.inputs.forEach(({ name, description, mode, defaultValue }) => {
//       inputs[name] = { description, mode: mode ?? "required", defaultValue };
//     });
//   }

//   // Creating an output object if there is an output defined.
//   if (data.output) {
//     outputs[data.output.name] = {
//       description: data.output.description,
//       next: () => {},
//     };
//   }

//   return {
//     id: data.id,
//     description: data.description,
//     namespace: data.namespace,
//     inputs,
//     outputs,
//     defaultStyle: {
//       icon: data.icon,
//       size: data.size,
//     },
//     // Modifying the function passed to run to receive two arguments; inputs and outputs.
//     run:
//       data.fullRunFn ??
//       async function (inputs, outputs, adv) {
//         const args = Object.values(inputs);
//         try {
//           const result = await Promise.resolve(data.run(...args)); // Using the arguments array to call the function.
//           if (data.output) {
//             outputs[data.output.name].next(result); // Updating the output with the result returned from the function.
//           }
//         } catch (e) {
//           console.error("Error in node", e);
//           adv.onError(e);
//         }
//       },
//     customViewCode: data.customViewCode,
//   };
// }
