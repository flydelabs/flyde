import { FlydeFlow, flydeFlowSchema } from "@flyde/core";
import * as yaml from "yaml";
import { cleanUnusedImports } from "./cleanUnusedImports";

export const serializeFlow = (flow: FlydeFlow) => {
  let parsed = flydeFlowSchema.parse(cleanUnusedImports(flow));

  return yaml.stringify(parsed, { aliasDuplicateObjects: false });
};
