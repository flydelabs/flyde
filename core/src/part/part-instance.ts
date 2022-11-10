import { InputPinsConfig, Part, PartDefinition, PartStyle, Pos } from "..";


export interface PartInstanceConfig {
  inputConfig: InputPinsConfig;
  visibleInputs?: string[];
  visibleOutputs?: string[];
  displayName?: string;
  style?: PartStyle;
}

export interface RefPartInstance extends PartInstanceConfig{
  id: string;
  partId: string;
  pos: Pos;
}

export interface InlinePartInstance extends PartInstanceConfig {
  id: string;
  part: Part;
  pos: Pos;
}
export type PartInstance = RefPartInstance | InlinePartInstance;

export const partInstance = (
  id: string,
  partOrId: string,
  config?: InputPinsConfig,
  pos?: Pos
): PartInstance => ({
  id,
  partId: partOrId,
  inputConfig: config || {},
  pos: pos || { x: 0, y: 0 },
});

export const inlinePartInstance = (
  id: string,
  part: Part,
  config?: InputPinsConfig,
  pos?: Pos
): PartInstance => ({
  id,
  part,
  inputConfig: config || {},
  pos: pos || { x: 0, y: 0 },
});

export const isInlinePartInstance = (ins: PartInstance): ins is InlinePartInstance => {
  return !!(ins as any).part;
}
export const isRefPartInstance = (ins: PartInstance): ins is RefPartInstance => !isInlinePartInstance(ins);

export const PartInstance = (
  id: string,
  part: PartDefinition,
  config?: InputPinsConfig,
  pos?: Pos
): PartInstance => ({
  id,
  partId: part.id,
  inputConfig: config || {},
  pos: pos || { x: 0, y: 0 },
});
