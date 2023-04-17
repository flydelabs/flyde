export * from "./common";
import { Pos, OMap } from "./common";
import {
  CustomPart,
  VisualPart,
  InputPinsConfig,
  maybeGetStaticValuePartId,
  Part,
  PartDefinition,
} from "./part";

export * from "./connect";

export * from "./execute";
export * from "./simplified-execute";

export * from "./part";

export * from "./part/get-part-with-dependencies";

// export * from "./serdes";

export * from "./inline-value-to-code-part";

export * from "./web-project";

export * from "./flow-schema";

export type InputStaticValue = string | number | object | VisualPart;

export const isStaticValueVisualPart = (val: InputStaticValue): boolean => {
  return !!val && !!maybeGetStaticValuePartId(`${val}`);
};

export interface InstanceViewData {
  id: string;
  partIdOrGroup: string | VisualPart;
  pos: Pos;
  visibleOptionalInputs?: string[];
  inputConfig: InputPinsConfig;
}

export type PartsCollection = OMap<Part>;

export type PartsDefCollection = OMap<PartDefinition>;

export type CustomPartsCollection = OMap<CustomPart>;
