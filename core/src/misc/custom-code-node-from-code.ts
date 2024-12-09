import { isCodeNode, isMacroNode, MacroNode, Node } from "@flyde/core";
import { transpileFile } from "./transpile-file/transpile-file";
import { improvedMacroToOldMacro } from "./improved-macros.ts/improved-macros";

export function customCodeNodeFromCode(
  code: string,
  suffixId?: string
): Node | MacroNode<any> {
  const transpiledCode = transpileFile("", code);

  // Wrap the transpiled code to handle default export
  const wrappedCode = `(function () {
      const __imports = arguments[0];
      const __exports = {};
      ${transpiledCode}

      return __exports;
  })(arguments)
  `;

  // const wrappedCode = transpiledCode;

  const result = new Function(wrappedCode)({});

  console.log(wrappedCode);

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
