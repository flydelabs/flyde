import { isCodeNode, isMacroNode, MacroNode, Node } from "../";
import { transpileFile } from "./transpile-file/transpile-file";
import {
  ImprovedMacroNode,
  processImprovedMacro,
} from "../improved-macros/improved-macros";

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

  const validNodes = Object.values(result).filter(
    (node) => isCodeNode(node) || isMacroNode(node)
  );

  if (validNodes.length === 0) {
    throw new Error("No valid nodes found");
  }

  if (validNodes.length > 1) {
    throw new Error("Multiple valid nodes found");
  }

  const node = validNodes[0];

  if (isCodeNode(node) || isMacroNode(node)) {
    if ((node as ImprovedMacroNode).icon) {
      const macro = processImprovedMacro(
        node as ImprovedMacroNode
      ) as MacroNode<any>;
      macro.id = `${macro.id}${suffixId ? `-${suffixId}` : ""}`;
      return macro;
    }
    node.id = `${node.id}${suffixId ? `-${suffixId}` : ""}`;
    return node;
  } else {
    throw new Error("Invalid node type");
  }
}
