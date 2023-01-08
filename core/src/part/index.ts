import {
  OMap,
  OMapF,
  entries,
  isDefined,
  testDataCreator,
  noop,
} from "../common";
import { Subject } from "rxjs";

import { CancelFn, InnerExecuteFn } from "../execute";
import { ConnectionData } from "../connect";
import { Pos, PartDefRepo, PartRepo, partInput, partOutput } from "..";
import { isInlinePartInstance, PartInstance } from "./part-instance";
import { InputPin, InputPinMap, OutputPin, OutputPinMap } from "./part-pins";

export * from "./part-instance";
export * from "./part-pins";
export * from "./pin-config";

export type PartState = Map<string, any>;

export type PartAdvancedContext = {
  execute: InnerExecuteFn;
  insId: string;
  state: PartState;
  onCleanup: (cb: Function) => void;
  onError: (e: any) => void;
  context: Record<string, any>;
};

export type PartFn = (
  args: OMapF<any>,
  o: OMapF<Subject<any>>,
  adv?: PartAdvancedContext
) => void | CancelFn | Promise<void | CancelFn>;

export type CustomPartViewFn = (
  instance: PartInstance,
  inputs: OMap<PartInstance[]>,
  outputs: OMap<PartInstance[]>,
  repo: PartDefRepo
) =>
  | {
      label: string;
      hiddenInputs?: string[];
      hiddenOutputs?: string[];
    }
  | false;

export type PartStyleSize = "small" | "regular" | "large";
export type PartTypeIcon = string | [string, string];

export interface PartStyle {
  icon?: PartTypeIcon;
  size?: PartStyleSize;
  color?: string | [string, string];
  cssOverride?: Record<string, string>;
}

export interface BasePart {
  id: string;
  description?: string;
  inputs: Record<string, InputPin>;
  outputs: Record<string, OutputPin>;

  namespace?: string;

  completionOutputs?: string[];
  reactiveInputs?: string[];

  customViewCode?: string;

  defaultStyle?: PartStyle;
}

export interface CodePart extends BasePart {
  fn: PartFn;
  customView?: CustomPartViewFn;
}

export enum InlineValuePartType {
  VALUE = "value",
  FUNCTION = "function",
}

export interface InlineValuePart extends BasePart {
  fnCode: string;
  dataBuilderSource?: string; // quick solution for "Data builder iteration"
  templateType?: InlineValuePartType;
}

export interface GroupedPart extends BasePart {
  inputsPosition: OMap<Pos>;
  outputsPosition: OMap<Pos>;
  instances: PartInstance[];
  connections: ConnectionData[];
  customView?: CustomPartViewFn;
}

export type Part = CodePart | CustomPart;

export type ImportablePart = { module: string; part: BasePart };

export type CustomPart = GroupedPart | InlineValuePart;

export type CodePartDefinition = Omit<CodePart, "fn">;

export type PartDefinition = CustomPart | CodePartDefinition;

export type PartModuleMetaData = {
  imported?: boolean;
};

export type PartDefinitionWithModuleMetaData = PartDefinition &
  PartModuleMetaData;

export const isCodePart = (p: Part | PartDefinition): p is CodePart => {
  return !isGroupedPart(p);
};

export const isGroupedPart = (p: Part | PartDefinition): p is GroupedPart => {
  return !!(p as GroupedPart).instances;
};

export const isInlineValuePart = (
  p: Part | PartDefinition | undefined
): p is InlineValuePart => {
  return isDefined(p) && isDefined((p as InlineValuePart).fnCode);
};

export const groupedPart = testDataCreator<GroupedPart>({
  id: "grouped-part",
  inputs: {},
  outputs: {},
  instances: [],
  connections: [],
  outputsPosition: {},
  inputsPosition: {},
});

export const codePart = testDataCreator<CodePart>({
  id: "part",
  inputs: {},
  outputs: {},
  fn: noop as any,
});

export const inlineValuePart = testDataCreator<InlineValuePart>({
  id: "part",
  inputs: {},
  outputs: {},
  fnCode: "",
});

export type SimplifiedPartParams = {
  id: string;
  inputTypes: OMap<string>;
  outputTypes: OMap<string>;
  fn: PartFn;
};

export const fromSimplified = ({
  fn,
  inputTypes,
  outputTypes,
  id,
}: SimplifiedPartParams): CodePart => {
  const inputs: InputPinMap = entries(inputTypes).reduce<InputPinMap>(
    (p, [k, v]) => ({ ...p, [k]: { type: v } }),
    {}
  );
  const outputs: OutputPinMap = entries(outputTypes).reduce<InputPinMap>(
    (p, [k, v]) => ({ ...p, [k]: { type: v } }),
    {}
  );
  return {
    id,
    inputs,
    outputs,
    fn,
  };
};

export const maybeGetStaticValuePartId = (value: string) => {
  const maybePartMatch =
    typeof value === "string" && value.match(/^__part\:(.*)/);
  if (maybePartMatch) {
    const partId = maybePartMatch[1];
    return partId;
  }
  return null;
};
export const getStaticValue = (
  value: any,
  repo: PartDefRepo,
  calleeId: string
) => {
  const maybePartId = maybeGetStaticValuePartId(value);
  if (maybePartId) {
    const part = repo[maybePartId];
    if (!part) {
      throw new Error(
        `Instance ${calleeId} referrer to a part reference ${maybePartId} that does not exist`
      );
    }
    return part;
  } else {
    return value;
  }
};

export const getPart = (
  idOrIns: string | PartInstance,
  repo: PartRepo
): Part => {
  if (typeof idOrIns !== "string" && isInlinePartInstance(idOrIns)) {
    return idOrIns.part;
  }
  const id = typeof idOrIns === "string" ? idOrIns : idOrIns.partId;
  const part = repo[id];
  if (!part) {
    throw new Error(`Part with id ${id} not found`);
  }
  return part;
};

export const getPartDef = (
  idOrIns: string | PartInstance,
  repo: PartDefRepo
): PartDefinition => {
  if (typeof idOrIns !== "string" && isInlinePartInstance(idOrIns)) {
    return idOrIns.part;
  }
  const id = typeof idOrIns === "string" ? idOrIns : idOrIns.partId;
  const part = repo[id];
  if (!part) {
    console.error(`Part with id ${id} not found`);
    throw new Error(`Part with id ${id} not found`);
  }
  return part;
};

export type codeFromFunctionParams = {
  id: string;
  fn: Function;
  inputNames: string[];
  outputName: string;
  defaultStyle?: PartStyle;
};

export const codeFromFunction = ({
  id,
  fn,
  inputNames,
  outputName,
  defaultStyle,
}: codeFromFunctionParams): CodePart => {
  return {
    id,
    inputs: inputNames.reduce(
      (acc, k) => ({ ...acc, [k]: partInput("any") }),
      {}
    ),
    outputs: { [outputName]: partOutput() },
    fn: (inputs, outputs) => {
      const args = inputNames.map((name) => inputs[name]);
      const output = outputs[outputName];
      const result = fn(...args);
      return Promise.resolve(result).then((val) => output.next(val));
    },
    completionOutputs: [outputName],
    defaultStyle,
  };
};
