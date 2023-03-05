import axios from "axios";
import { compileObjectTemplate, compileStringTemplate, debugLogger, isDefined } from "../common";

import { isInlineValuePart, CodePart, dynamicPartInput, InlineValuePart, dynamicOutput, PartRepo } from "../part";

import { getVM2Instance } from "./get-vm2";

const vm2 = getVM2Instance();

export const inlineValuePartToPart = (
  inlineValuePart: InlineValuePart,
  extraContext: Record<string, any> = {}
): CodePart => {
  const { fnCode, ...rest } = inlineValuePart;

  const logger = debugLogger(`code-part:${inlineValuePart.id}`);

  const wrappedCode = `
  try {
    ${fnCode}
  } catch (e) {
    adv.onError(e);
  }
  `;

  const script = new vm2.VMScript(wrappedCode);
  const part: CodePart = {
    ...rest,
    fn: (inputs, outputs, adv) => {
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
            env: process.env
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

export const customRepoToPartRepo = (
  customPartRepo: PartRepo,
  extraContext: Record<string, any> = {}
): PartRepo => {
  const newRepo = {};
  for (let id in customPartRepo) {
    const part = customPartRepo[id];
    newRepo[id] = isInlineValuePart(part)
      ? inlineValuePartToPart(part, extraContext)
      : part;
  }
  return newRepo;
};
