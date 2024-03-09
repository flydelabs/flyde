import {
  MacroEditorConfigCustomDefinition,
  MacroNode,
  MacroNodeDefinition,
} from "@flyde/core";
import { readFileSync } from "fs";
import { join } from "path";

export function macroNodeToDefinition<T>(
  macro: MacroNode<T>,
  importPath: string
): MacroNodeDefinition<T> {
  if (macro.editorConfig.type === "structured") {
    return macro as MacroNodeDefinition<T>;
  }

  const macroDef: MacroNodeDefinition<any> = {
    ...macro,
    editorConfig: {
      type: "custom",
      editorComponentBundleContent: "",
    } as MacroEditorConfigCustomDefinition,
  };
  const editorComponentPath = join(
    importPath,
    macro.editorConfig.editorComponentBundlePath
  );

  try {
    const content = readFileSync(editorComponentPath, "utf8");
    macroDef.editorConfig = {
      type: "custom",
      editorComponentBundleContent: content,
    };
  } catch (e) {
    macroDef.editorConfig = {
      type: "custom",
      editorComponentBundleContent: `throw new Error("Could not load editor component bundle for ${macro.id} in ${importPath} at ${editorComponentPath}")`,
    };
  }
  return macroDef;
}
