export * from "./common";
import { Pos } from "./common";
import { FlydeFlow } from "./flow-schema";
import { VisualNode, InputPinsConfig } from "./node";

export * from "./connect/helpers";
export * from "./execute";
export * from "./simplified-execute";
export * from "./node";
export * from "./flow-schema";

export * from "./types/connections";

export * from "./types/editor";

export * from "./improved-macros/improved-macros";
export {
  extractInputsFromValue,
  replaceInputsInValue,
  renderDerivedString,
  evaluateCondition,
  evaluateFieldVisibility,
  createInputGroup,
} from "./improved-macros/improved-macro-utils";

export interface InstanceViewData {
  id: string;
  nodeIdOrGroup: string | VisualNode;
  pos: Pos;
  visibleOptionalInputs?: string[];
  inputConfig: InputPinsConfig;
}

export interface FlowJob {
  flow: FlydeFlow;
  id: string;
}
