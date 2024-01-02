import { FlydeFlow, flydeFlowSchema } from "@flyde/core";
import * as yaml from "yaml";
import { cleanUnusedImports } from "./cleanUnusedImports";

export const serializeFlow = (flow: FlydeFlow) => {
  const importsCleaned = cleanUnusedImports(flow);

  let parsed = flydeFlowSchema.parse(importsCleaned);

  return yaml.stringify(parsed, { aliasDuplicateObjects: false });
};
