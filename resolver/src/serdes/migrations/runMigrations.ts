import { VisualNode } from "@flyde/core";
import { migrateToPR198Structure } from "./pr198";

export function runMigrations(data: { node?: VisualNode; imports?: any }): {
  node?: VisualNode;
  imports?: any;
} {
  migrateToPR198Structure(data);
  return data;
}
