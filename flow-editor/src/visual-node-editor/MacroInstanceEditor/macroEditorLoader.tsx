import { MacroNodeDefinition } from "@flyde/core";
import React from "react";

export function loadMacroEditor(
  macroNode: MacroNodeDefinition<any>
): React.FC<any> {
  const w: any = window;
  const { id, editorComponentBundleContent } = macroNode;

  const exportId = `__MacroNode__${id}`;

  // ensure React is available for the window loaded component
  w.React = React;

  try {
    // eslint-disable-next-line no-eval
    eval(editorComponentBundleContent);

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
          Failed to load macro node - please check that bundle that {id} exposes
          an editable component to window.{exportId}
        </span>
      );
    };
  }
}
