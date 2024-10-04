import { VisualNode } from "@flyde/core";
import { migrateMacroNodeV2 } from "./macroNodeV2";
import { migrateOldStdlibNodes } from "./oldStdlibNods";

export function runMigrations(data: { node?: VisualNode; imports?: any }): {
  node?: VisualNode;
  imports?: any;
} {
  migrateOldStdlibNodes(data);
  migrateMacroNodeV2(data);
  return data;
}
