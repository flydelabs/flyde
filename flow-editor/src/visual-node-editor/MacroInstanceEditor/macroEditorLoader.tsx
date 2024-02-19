import { MacroNodeDefinition } from "@flyde/core";
import React from "react";
import * as Blueprint from "@blueprintjs/core";
import * as BlueprintSelect from "@blueprintjs/select";
import { buildStructuredMacroEditorComp } from "./buildStructuredMacroEditor";

export function loadMacroEditor(
  macroNode: MacroNodeDefinition<any>
): React.FC<any> {
  const w: any = window;
  const { id, editorConfig } = macroNode;

  const exportId = `__MacroNode__${id}`;

  // ensure React and BP are available for the editor comps
  w.React = React;
  w.Blueprint = Blueprint;
  w.BlueprintSelect = BlueprintSelect;

  if (editorConfig.type === "custom") {
    try {
      // eslint-disable-next-line no-eval
      eval(editorConfig.editorComponentBundleContent);

      const compModule = w[exportId];
      const comp = compModule?.default || compModule;

      if (!comp) {
        return function () {
          return (
            <span>
              Failed to load macro node - please check that bundle that {id}{" "}
              exposes an editable component to window.{exportId}
            </span>
          );
        };
      }

      w.Comp = comp;

      return comp;
    } catch (e) {
      console.error(e);
      return function () {
        return (
          <span>
            Failed to load macro node - please check that bundle that {id}{" "}
            exposes an editable component to window.{exportId}
          </span>
        );
      };
    }
  } else {
    return buildStructuredMacroEditorComp(editorConfig);
  }
}
