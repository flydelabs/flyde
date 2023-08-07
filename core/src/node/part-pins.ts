import { Subject } from "rxjs";
import { OMapF } from "..";

import { isStaticInputPinConfig } from ".";
import { repeat, testDataCreator } from "../common";
import {
  queueInputPinConfig,
  QueueInputPinConfig,
  StaticInputPinConfig,
  staticInputPinConfig,
  StickyInputPinConfig,
} from "./pin-config";

export type PinType = "input" | "output";
export type InputMode = "optional" | "required" | "required-if-connected";

export interface BasePinData {
  description?: string;
}

export interface InputPin extends BasePinData {
  mode?: InputMode;
  defaultValue?: any;
}

export type InputPinMap = Record<string, InputPin>;

export type OutputPinMap = Record<string, OutputPin>;

export interface OutputPin extends BasePinData {
  delayed?: boolean;
}

export const nodeInput = (mode: InputMode = "required"): InputPin => ({
  mode,
});

export const isInputPinOptional = (input: InputPin) => {
  return input.mode === "optional";
};

export const nodeInputs = (count: number, modes?: InputMode[]): InputPin[] =>
  repeat(count, (idx) => {
    return nodeInput(modes?.[idx] || "required");
  });

export const nodeOutput = (delayed = false): OutputPin => ({
  delayed,
});

export const nodeOutputs = (count: number): OutputPin[] =>
  repeat(count, () => {
    return nodeOutput();
  });

export type DynamicNodeInput = {
  subject: Subject<any>;
  config: StickyInputPinConfig | QueueInputPinConfig;
};

export type StaticPartInput = {
  config: StaticInputPinConfig;
};

export type PartInput = DynamicNodeInput | StaticPartInput;

export type PartOutput = Subject<any>;

export type PartOutputs = OMapF<PartOutput>;

export type PartInputs = OMapF<PartInput>;

export interface DynamicOutput extends Subject<any> {}

export const dynamicOutput = (): DynamicOutput => new Subject();

export const dynamicPartInput = testDataCreator<DynamicNodeInput>(() => {
  return {
    subject: new Subject(),
    config: queueInputPinConfig(),
  };
});

export const dynamicPartInputs = (count: number = 10) =>
  repeat(count, () =>
    testDataCreator<DynamicNodeInput>(() => {
      return {
        subject: new Subject(),
        config: queueInputPinConfig(),
      };
    })()
  );

export const staticPartInput = (value: any): StaticPartInput => ({
  config: staticInputPinConfig(value),
});

export const isDynamicInput = (
  arg: PartInput | undefined
): arg is DynamicNodeInput => {
  const dArg = arg as DynamicNodeInput;
  return dArg && dArg.subject && !!dArg.subject.next;
};

export const isStaticInput = (
  arg: PartInput | undefined
): arg is StaticPartInput => {
  return isStaticInputPinConfig(arg?.config);
};

export const extractStaticValue = (arg: PartInput) => {
  if (isStaticInput(arg)) {
    return arg.config.value;
  } else {
    throw new Error(`Cannot extract static value from non static arg`);
  }
};

export const isEnvValue = (value: any) => {
  return typeof value === "string" && value.startsWith("$ENV.");
};

export const toEnvValue = (name: any) => {
  return `$ENV.${name}`;
};

export const getEnvKeyFromValue = (value: string) => {
  if (typeof value === "string") {
    return value.replace(/^\$ENV\./, "");
  } else {
    return value;
  }
};
