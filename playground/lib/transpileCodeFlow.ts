import { AppFile } from "@/components/AppView";
import { transpileFile } from "./transpileFile/transpileFile";
import { InternalCodeNode, isCodeNode } from "@flyde/core";

export function transpileCodeNodes(file: AppFile): InternalCodeNode[] {
  const code = transpileFile(file.name, file.content);

  const codeToRun = `
    (function executeApp(window) {
        ${code}
        return window.__modules["${file.name}"];
      })({__modules: {}})`;

  try {
    const exports = Object.values(eval(codeToRun) ?? {});
    return exports.filter((obj: any): obj is InternalCodeNode =>
      isCodeNode(obj)
    );
  } catch (e) {
    console.error(e);
    return [];
  }
}
