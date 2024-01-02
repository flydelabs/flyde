import { MacroNodeDefinition } from "@flyde/core";

export function loadMacroEditor(
  macroNode: MacroNodeDefinition<any>
): React.FC<any> {
  const { id, editorComponentBundleContent } = macroNode;

  const exportId = `__MacroNode__${id}`;

  try {
    // eslint-disable-next-line no-eval
    eval(editorComponentBundleContent);
    const w: any = window;
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
