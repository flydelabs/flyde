import { isCodeNode, isMacroNode, MacroNode, Node } from "@flyde/core";
import { transpileFile } from "./transpileFile/transpileFile";
import { improvedMacroToOldMacro } from "@flyde/stdlib/dist/ImprovedMacros/improvedMacros";

export function customCodeNodeFromCode(
  code: string,
  suffixId?: string
): Node | MacroNode<any> {
  const transpiledCode = transpileFile("", code);

  // Wrap the transpiled code to handle default export
  const wrappedCode = `
      const __imports = arguments[0];
      const __exports = {};
      ${transpiledCode}
  `;

  const result = new Function(wrappedCode)({});

  if (isCodeNode(result.default) || isMacroNode(result.default)) {
    if (result.default.icon) {
      const macro = improvedMacroToOldMacro(result.default) as MacroNode<any>;
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
