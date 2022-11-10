export * from "./common";
import { Pos, OMap } from "./common";
import { ExecuteEnv } from "./execute";
import {
  CustomPart,
  GroupedPart,
  InputPinsConfig,
  maybeGetStaticValuePartId,
  Part,
  PartDefinition,
} from "./part";


export * from "./connect";

export * from "./execute";
export * from './simplified-execute';

export * from "./part";

export * from './part/get-part-with-dependencies';

// export * from "./serdes";

export * from "./utils";

export * from "./code-to-native";

export * from "./web-project";

export * from './project';
export * from './flow-schema';


export type InputStaticValue = string | number | object | GroupedPart;

export const isStaticValueGroupedPart = (val: InputStaticValue): boolean => {
  return val && !!maybeGetStaticValuePartId(`${val}`);
};

export enum ProjectType {
  WEB_UI = "web-ui",
  SERVER = "server",
  MOBILE = "mobile",
  CLI = "cli",
}

export interface InstanceViewData {
  id: string;
  partIdOrGroup: string | GroupedPart;
  pos: Pos;
  visibleOptionalInputs?: string[];
  inputConfig: InputPinsConfig;
}

export type PartRepo = OMap<Part>;

export type PartDefRepo = OMap<PartDefinition>;

export type CustomPartRepo = OMap<CustomPart>;
