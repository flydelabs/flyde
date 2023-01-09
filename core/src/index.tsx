export * from "./common";
import { Pos, OMap } from "./common";
import { ExecuteEnv } from "./execute";
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

export * from "./utils";

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

export type PartRepo = OMap<Part>;

export type PartDefRepo = OMap<PartDefinition>;

export type CustomPartRepo = OMap<CustomPart>;
