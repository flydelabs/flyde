import flydeCoreBundledDts from "!raw-loader!../types/@flyde-core.d.ts";
import flydeRuntimeBundledDts from "!raw-loader!../types/@flyde-runtime.d.ts";

export function configureMonaco(monaco: any) {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    flydeCoreBundledDts,
    "types/@flyde-core.d.ts"
  );

  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    flydeRuntimeBundledDts,
    "types/@flyde-runtime.d.ts"
  );

  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `
    /** Helps communicate with the right output pane. Source code is available on GitHub and is very simple. No voodoo magic. */
    declare var FlydePlayground: {
      /** 
       * Sets the mode for the output pane in the playground.
       * @param mode - The mode to set, either "string" or "jsx".
       * @remarks Source code for this function is available on GitHub.
       */
      setMode: (mode: "string" | "jsx") => void;
  
      /**
       * Adds output to the right output pane in the playground.
       * - When mode is "string", adds the given output as text.
       * - When mode is "jsx", renders the output using ReactDOM.
       * @param output - The output to add or render.
       * @remarks Source code for this function is available on GitHub.
       */
      addOutput: (key: string, output: any) => void;

      /**
       * The inputs for the current flow.
       * @remarks Source code for this function is available on GitHub.
       */
      inputs: Record<string, DynamicNodeInput>;
    };
    declare var React: any;
    declare var ReactDOM: any;
    `,
    "filename/flyde.d.ts"
  );

  const opts =
    monaco.languages.typescript.typescriptDefaults.getCompilerOptions();

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    ...opts,
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    module: monaco.languages.typescript.ModuleKind.ESNext,
  });
}
