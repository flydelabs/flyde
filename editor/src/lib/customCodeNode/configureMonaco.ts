import { flydeCoreTypes } from "../../types/flyde-core-types";

export function configureMonaco(monaco: any) {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    flydeCoreTypes,
    "file:///node_modules/@flyde/core/index.d.ts"
  );

  const compilerOptions =
    monaco.languages.typescript.typescriptDefaults.getCompilerOptions();
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    ...compilerOptions,
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    isolatedModules: true,
    noEmit: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
  });
}
