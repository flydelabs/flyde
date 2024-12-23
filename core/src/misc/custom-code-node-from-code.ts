import { isCodeNode, isMacroNode, MacroNode, Node } from "../";
import { transpileFile } from "./transpile-file/transpile-file";
import { processImprovedMacro } from "../improved-macros/improved-macros";

export function customCodeNodeFromCode(
  code: string,
  suffixId?: string,
  imports?: { [key: string]: any }
): Node | MacroNode<any> {
  const transpiledCode = transpileFile("", code);

  // Wrap the transpiled code to handle default export
  const wrappedCode = `
      const __imports = arguments[0];
      let __exports = {};
      ${transpiledCode}
  `;

  const result = new Function(wrappedCode)(imports);

  if (isCodeNode(result.default) || isMacroNode(result.default)) {
    if (result.default.icon) {
      const macro = processImprovedMacro(result.default) as MacroNode<any>;
      macro.id = `${macro.id}${suffixId ? `-${suffixId}` : ""}`;
      return macro;
    }
    const node = result.default as Node;
    node.id = `${node.id}${suffixId ? `-${suffixId}` : ""}`;
    return node;
  } else {
    throw new Error("Invalid node type");
  }
}
