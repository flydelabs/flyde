import { ImportedNode, isBaseNode } from "@flyde/core";
import stdLibBrowser from "@flyde/stdlib/dist/all-browser";

export async function onRequestImportables() {
  const nodes = Object.values(stdLibBrowser).filter(
    isBaseNode
  ) as ImportedNode[];
  return {
    importables: nodes.map((b) => ({
      node: { ...b, source: { path: "n/a", export: "n/a" } },
      module: "@flyde/stdlib",
    })),
    errors: [],
  };
}
