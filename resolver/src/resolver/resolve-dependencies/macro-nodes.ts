import {
  CodeNode,
  MacroNode,
  MacroNodeDefinition,
  MacroNodeInstance,
} from "@flyde/core";
import { readFileSync } from "fs";
import { join } from "path";

export function macroNodeToDefinition<T>(
  macro: MacroNode<T>,
  importPath: string
): MacroNodeDefinition<T> {
  const macroDef: MacroNodeDefinition<any> = {
    ...macro,
    editorComponentBundleContent: "",
  };
  const editorComponentPath = join(importPath, macro.editorComponentBundlePath);

  try {
    const content = readFileSync(editorComponentPath, "utf8");
    macroDef.editorComponentBundleContent = content;
  } catch (e) {
    macroDef.editorComponentBundleContent = `throw new Error("Could not load editor component bundle for ${macro.id} in ${importPath} at ${editorComponentPath}")`;
    console.warn(
      `Could not load editor component bundle for ${macro.id} in ${importPath} at ${editorComponentPath}`
    );
  }
  return macroDef;
}

export function processMacroNode(
  namespace: string,
  macro: MacroNode<any>,
  instance: MacroNodeInstance
) {
  const metaData = macro.definitionBuilder(instance.macroData);
  const runFn = macro.runFnBuilder(instance.macroData);

  const id = `${namespace}${macro.id}__${instance.id}`;

  const resolvedNode: CodeNode = {
    ...metaData,
    displayName: metaData.displayName ?? macro.id,
    namespace: macro.namespace,
    id,
    run: runFn,
  };

  return resolvedNode;
}
