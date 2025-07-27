import ts from "typescript";
import { exportToGlobalTransformer } from "./exportsTransformer";
import { importToGlobalTransformer } from "./tsTransformer";
import { stripTypesTransformer } from "./stripTypesTransformer";

export function transpileFile(fileName: string, content: string) {
  const transpileOutput = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    transformers: {
      before: [
        importToGlobalTransformer(),
        stripTypesTransformer(),
        exportToGlobalTransformer(fileName),
      ],
    },
  });

  return transpileOutput.outputText.replace(/export\s*{\s*};\s*/g, "");
}
