import {
  isInlineNodeInstance,
  isMacroNodeInstance,
  isRefNodeInstance,
  isVisualNode,
  MacroNodeInstance,
  VisualNode,
} from "@flyde/core";
import { migrateMacroNodeV2 } from "./macroNodeV2";
import { migrateOldStdlibNodes } from "./oldStdlibNods";

export function runMigrations(data: { node?: VisualNode; imports?: any }): {
  node?: VisualNode;
  imports?: any;
} {
  migrateOldStdlibNodes(data);
  migrateMacroNodeV2(data);
  migrateAllToMacroNode(data.node);

  return data;
}

function migrateAllToMacroNode(node: VisualNode) {
  for (const instance of node.instances) {
    if (isMacroNodeInstance(instance)) {
      continue;
    }

    if (isInlineNodeInstance(instance)) {
      if (isVisualNode(instance.node)) {
        migrateAllToMacroNode(instance.node);
      }
    }

    if (isRefNodeInstance(instance)) {
      console.log("migrating");
      let ins = instance as unknown as MacroNodeInstance;
      // ins.macroId = ins.nodeId;
    }
  }
}
