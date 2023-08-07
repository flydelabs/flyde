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

export type StaticNodeInput = {
  config: StaticInputPinConfig;
};

export type NodeInput = DynamicNodeInput | StaticNodeInput;

export type NodeOutput = Subject<any>;

export type NodeOutputs = OMapF<NodeOutput>;

export type NodeInputs = OMapF<NodeInput>;

export interface DynamicOutput extends Subject<any> {}

export const dynamicOutput = (): DynamicOutput => new Subject();

export const dynamicNodeInput = testDataCreator<DynamicNodeInput>(() => {
  return {
    subject: new Subject(),
    config: queueInputPinConfig(),
  };
});

export const dynamicNodeInputs = (count: number = 10) =>
  repeat(count, () =>
    testDataCreator<DynamicNodeInput>(() => {
      return {
        subject: new Subject(),
        config: queueInputPinConfig(),
      };
    })()
  );

export const staticNodeInput = (value: any): StaticNodeInput => ({
  config: staticInputPinConfig(value),
});

export const isDynamicInput = (
  arg: NodeInput | undefined
): arg is DynamicNodeInput => {
  const dArg = arg as DynamicNodeInput;
  return dArg && dArg.subject && !!dArg.subject.next;
};

export const isStaticInput = (
  arg: NodeInput | undefined
): arg is StaticNodeInput => {
  return isStaticInputPinConfig(arg?.config);
};

export const extractStaticValue = (arg: NodeInput) => {
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
