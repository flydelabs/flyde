import axios from "axios";
import { CodePart, compileObjectTemplate, compileStringTemplate, debugLogger, PartRepo } from "..";

import { isCodePart, NativePart, dynamicPartInput } from "../part";

import { dynamicOutput, isDefined } from "..";
import { getVM2Instance } from "./get-vm2";

const vm2 = getVM2Instance();

export const codePartToNative = (codePart: CodePart, extraContext: Record<string, any> = {}) => {
  
  const { fnCode, ...rest } = codePart;

  const logger = debugLogger(`code-part:${codePart.id}`);

  const wrappedCode = `
  try {
    ${fnCode}
  } catch (e) {
    adv.onError(e);
  }
  `;

  const script = new vm2.VMScript(wrappedCode);
  const part: NativePart = {
    ...rest,
    fn: (inputs, outputs, adv) => {
      const log = (...args: any[]) => {
        logger(`Log from code part ${codePart.id} [${adv.insId}]`, ...args);
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
          __FLYDE_MODE: process.env.NODE_ENV,
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
    newRepo[id] = isCodePart(part) ? codePartToNative(part, extraContext) : part;
  }
  return newRepo;
};
