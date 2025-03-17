import {
  isInlineNodeInstance,
  isCodeNodeInstance,
  isRefNodeInstance,
  isVisualNode,
  VisualNode,
  FlydeFlow,
  CodeNodeInstance,
  VisualNodeInstance,
} from "@flyde/core";
import { migrateMacroNodeV2 } from "./macroNodeV2";
import { migrateOldStdlibNodes } from "./oldStdlibNods";
import { migrateToPR198Structure } from "./pr198";

export function runMigrations(data: { node?: VisualNode; imports?: any }): {
  node?: VisualNode;
  imports?: any;
} {
  migrateOldStdlibNodes(data);
  migrateMacroNodeV2(data);
  migrateToPR198Structure(data);

  console.log("Migrated data", data);

  return data;
}
