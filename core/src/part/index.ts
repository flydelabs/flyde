import { OMap, OMapF, entries, isDefined, testDataCreator, noop } from "../common";
import { Subject } from "rxjs";

import { CancelFn, InnerExecuteFn } from "../execute";
import { ConnectionData } from "../connect";
import { Pos, PartDefRepo, PartRepo } from "..";
import { isInlinePartInstance, PartInstance } from "./part-instance";
import { InputPin, InputPinMap, OutputPin, OutputPinMap, PartInput, PartInputs } from "./part-pins";
import { ResolvedFlydeFlowDefinition } from "../flow-schema";

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
};

export type PartFn = (
  args: OMapF<any>,
  o: OMapF<Subject<any>>,
  adv?: PartAdvancedContext
) => void | CancelFn;

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

export interface BasePart {
  id: string;
  description?: string;
  inputs: OMap<InputPin>;
  outputs: OMap<OutputPin>;

  namespace?: string;

  completionOutputs?: string[];
  reactiveInputs?: string[];

  customViewCode?: string;
}

export interface NativePart extends BasePart {
  fn: PartFn;
  customView?: CustomPartViewFn;
}

export enum CodePartTemplateTypeInline {
  VALUE = "value",
  FUNCTION = "function",
}


export type CodePartType = "file-reference" | "inline";

export interface CodePart extends BasePart {
  fnCode: string;
  dataBuilderSource?: string; // quick solution for "Data builder iteration"
  templateType?: CodePartTemplateTypeInline;
}

export interface GroupedPart extends BasePart {
  inputsPosition: OMap<Pos>;
  outputsPosition: OMap<Pos>;
  instances: PartInstance[];
  connections: ConnectionData[];
  customView?: CustomPartViewFn;
}

export type Part = NativePart | CustomPart;

export type ImportablePart = {module: string, part: BasePart};

export type CustomPart = GroupedPart | CodePart;

export type NativePartDefinition = Omit<NativePart, "fn">;

export type PartDefinition = CustomPart | NativePartDefinition;

export type PartModuleMetaData = {
  imported?: boolean;
}

export type PartDefinitionWithModuleMetaData = PartDefinition & PartModuleMetaData;

export const isNativePart = (p: Part | PartDefinition): p is NativePart => {
  return !isGroupedPart(p);
};

export const isGroupedPart = (p: Part | PartDefinition): p is GroupedPart => {
  return !!(p as GroupedPart).instances;
};

export const isCodePart = (p: Part | PartDefinition | undefined): p is CodePart => {
  return isDefined(p) && isDefined((p as CodePart).fnCode);
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

export const nativePart = testDataCreator<NativePart>({
  id: "part",
  inputs: {},
  outputs: {},
  fn: noop as any,
});

export const codePart = testDataCreator<CodePart>({
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
}: SimplifiedPartParams): NativePart => {
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

export const staticPartRefence = (part: Part) => {
  return `__part:${part.id}`;
};

export const maybeGetStaticValuePartId = (value: string) => {
  const maybePartMatch = typeof value === "string" && value.match(/^__part\:(.*)/);
  if (maybePartMatch) {
    const partId = maybePartMatch[1];
    return partId;
  }
  return null;
};
export const getStaticValue = (value: any, repo: PartDefRepo, calleeId: string) => {
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

export const getPart = (idOrIns: string | PartInstance, repo: PartRepo): Part => {

  if (typeof idOrIns !== 'string' && isInlinePartInstance(idOrIns)) {
    return idOrIns.part;
  }
  const id = typeof idOrIns === "string" ? idOrIns : idOrIns.partId;
  const part = repo[id];
  if (!part) {
    throw new Error(`Part with id ${id} not found`);
  }
  return part;
};

export const getPartDef = (idOrIns: string | PartInstance, repo: PartDefRepo): PartDefinition => {
  if (typeof idOrIns !== 'string' && isInlinePartInstance(idOrIns)) {
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
