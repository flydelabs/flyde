import { MacroNode, MacroNodeInstance, CodeNode } from "@flyde/core";

export function processMacroNodeInstance(
  namespace: string,
  macro: MacroNode<any>,
  instance: MacroNodeInstance
) {
  const metaData = macro.definitionBuilder(instance.macroData);
  const runFn = macro.runFnBuilder(instance.macroData);

  const id = `${namespace}${macro.id}__${instance.id}`;

  const resolvedNode: CodeNode = {
    ...metaData,
    defaultStyle: metaData.defaultStyle ?? macro.defaultStyle,
    displayName: metaData.displayName ?? macro.id,
    namespace: macro.namespace,
    id,
    run: runFn,
  };

  return resolvedNode;
}
