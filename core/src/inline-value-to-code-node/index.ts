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
  dynamicNodeInput,
  InlineValueNode,
  dynamicOutput,
  NodesCollection,
} from "../node";

import { getVM2Instance } from "./get-vm2";

const vm2 = getVM2Instance();

export const inlineValueNodeToNode = (
  inlineValueNode: InlineValueNode,
  extraContext: Record<string, any> = {}
): CodeNode => {
  const { runFnRawCode: fnCode, ...rest } = inlineValueNode;

  const logger = debugLogger(`code-node:${inlineValueNode.id}`);

  const wrappedCode = `
  try {
    ${fnCode}
  } catch (e) {
    adv.onError(e);
  }
  `;

  const script = new vm2.VMScript(wrappedCode);
  const node: CodeNode = {
    ...rest,
    run: (inputs, outputs, adv) => {
      const log = (...args: any[]) => {
        logger(
          `Log from code node ${inlineValueNode.id} [${adv.insId}]`,
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
          dynamicNodeInput,
          dynamicNodeArg: dynamicNodeInput,
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

  return node;
};

export const customNodesToNodesCollection = (
  customNodes: NodesCollection,
  extraContext: Record<string, any> = {}
): NodesCollection => {
  const nodesCollection: NodesCollection = {};
  for (let id in customNodes) {
    const node = customNodes[id];
    nodesCollection[id] = isInlineValueNode(node)
      ? inlineValueNodeToNode(node, extraContext)
      : node;
  }
  return nodesCollection;
};
