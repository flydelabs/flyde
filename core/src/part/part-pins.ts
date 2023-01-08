import { Subject } from "rxjs";
import { OMap, OMapF } from "..";

import { isStaticInputPinConfig } from ".";
import { repeat, testDataCreator } from "../common";
import {
  queueInputPinConfig,
  QueueInputPinConfig,
  StaticInputPinConfig,
  staticInputPinConfig,
  StickyInputPinConfig,
} from "./pin-config";

export type PinType = 'input' | 'output';
export type InputMode = "optional" | "required" | "required-if-connected";

export interface BasePinData {
  description?: string;
}

export interface InputPin extends BasePinData {
  mode?: InputMode;
  defaultValue?: any;
}

export type InputPinMap = OMap<InputPin>;

export type OutputPinMap = OMap<OutputPin>;

export interface OutputPin extends BasePinData {
  delayed?: boolean;
}

export const partInput = (
  mode: InputMode = "required"
): InputPin => ({
  mode,
});

export const isInputPinOptional = (input: InputPin) => {
  return input.mode === "optional";
};

export const partInputs = (count: number, modes?: InputMode[]): InputPin[] =>
  repeat(count, (idx) => {
    return partInput(modes[idx] || "required");
  });

export const partOutput = (
  delayed = false,
): OutputPin => ({
  delayed,
});

export const partOutputs = (count: number): OutputPin[] =>
  repeat(count, () => {
    return partOutput();
  });

export type DynamicPartInput = {
  subject: Subject<any>;
  config: StickyInputPinConfig | QueueInputPinConfig;
};

export type StaticPartInput = {
  config: StaticInputPinConfig;
};

export type PartInput = DynamicPartInput | StaticPartInput;

export type PartOutput = Subject<any>;

export type PartOutputs = OMapF<PartOutput>;

export type PartInputs = OMapF<PartInput>;

export interface DynamicOutput extends Subject<any> {}

export const dynamicOutput = (): DynamicOutput => new Subject();

export const dynamicPartInput = testDataCreator<DynamicPartInput>(() => {
  return {
    subject: new Subject(),
    config: queueInputPinConfig(),
  };
});

export const dynamicPartInputs = (count: number = 10) =>
  repeat(count, () =>
    testDataCreator<DynamicPartInput>(() => {
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
): arg is DynamicPartInput => {
  const dArg = arg as DynamicPartInput;
  return dArg && dArg.subject && !!dArg.subject.next;
};

export const isStaticInput = (
  arg: PartInput | undefined
): arg is StaticPartInput => {
  return isStaticInputPinConfig(arg.config);
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
