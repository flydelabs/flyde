import { InputPinsConfig, Part, PartDefinition, Pos } from "..";


export interface PartInstanceConfig {
  inputConfig: InputPinsConfig;
  visibleInputs?: string[];
  visibleOutputs?: string[];
  displayName?: string;
}
export interface PartInstance extends PartInstanceConfig{
  id: string;
  partId: string;
  pos: Pos;
}

export const partInstance = (
  id: string,
  partOrId: Part | string,
  config?: InputPinsConfig,
  pos?: Pos
): PartInstance => ({
  id,
  partId: typeof partOrId === "string" ? partOrId : partOrId.id,
  inputConfig: config || {},
  pos: pos || { x: 0, y: 0 },
});

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
