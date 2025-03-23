import { transpileFile } from "./transpile-file/transpile-file";
import { CodeNode, isCodeNode } from "../improved-macros/improved-macros";

export function customCodeNodeFromCode(
  code: string,
  _?: string,
  imports?: { [key: string]: any }
): CodeNode {
  const transpiledCode = transpileFile("", code);

  // Wrap the transpiled code to handle default export
  const wrappedCode = `
      const __imports = arguments[0];
      let __exports = {};
      ${transpiledCode}
  `;

  const result = new Function(wrappedCode)(imports);

  const validNodes = Object.values(result).filter((node) => isCodeNode(node));

  if (validNodes.length === 0) {
    throw new Error("No valid nodes found");
  }

  if (validNodes.length > 1) {
    throw new Error("Multiple valid nodes found");
  }

  const node = validNodes[0];

  if (isCodeNode(node)) {
    return node;
  } else {
    throw new Error("Invalid node type");
  }
}
