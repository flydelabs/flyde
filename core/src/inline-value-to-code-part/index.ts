import axios from "axios";
import {
  compileObjectTemplate,
  compileStringTemplate,
  debugLogger,
  isDefined,
} from "../common";

import {
  isInlineValueNode,
  CodeNode,
  dynamicPartInput,
  InlineValueNode,
  dynamicOutput,
  NodesCollection,
} from "../node";

import { getVM2Instance } from "./get-vm2";

const vm2 = getVM2Instance();

export const inlineValuePartToPart = (
  inlineValuePart: InlineValueNode,
  extraContext: Record<string, any> = {}
): CodeNode => {
  const { runFnRawCode: fnCode, ...rest } = inlineValuePart;

  const logger = debugLogger(`code-part:${inlineValuePart.id}`);

  const wrappedCode = `
  try {
    ${fnCode}
  } catch (e) {
    adv.onError(e);
  }
  `;

  const script = new vm2.VMScript(wrappedCode);
  const part: CodeNode = {
    ...rest,
    run: (inputs, outputs, adv) => {
      const log = (...args: any[]) => {
        logger(
          `Log from code part ${inlineValuePart.id} [${adv.insId}]`,
          ...args
        );
      };
      const vm = new vm2.VM({
        sandbox: {
          inputs,
          outputs,
          setInterval,
          clearInterval,
          setTimeout,
          clearTimeout,
          encodeURIComponent,
          adv,
          log,
          axios,
          DEFAULT_AXIOS_TIMEOUT: 15000,
          dynamicPartInput,
          dynamicPartArg: dynamicPartInput,
          dynamicOutput,
          isDefined,
          compileStringTemplate,
          compileObjectTemplate,
          process: {
            env: process.env,
          },
          ...extraContext,
        },
      });
      vm.run(script);
      // vm.disposeContext();
    },
  };

  return part;
};

export const customNodesToNodesCollection = (
  customNodes: NodesCollection,
  extraContext: Record<string, any> = {}
): NodesCollection => {
  const partsCollection: NodesCollection = {};
  for (let id in customNodes) {
    const part = customNodes[id];
    partsCollection[id] = isInlineValueNode(part)
      ? inlineValuePartToPart(part, extraContext)
      : part;
  }
  return partsCollection;
};
