import { NodeLibraryData, processImprovedMacro } from "@flyde/core";
import { macroNodeToDefinition } from "@flyde/resolver";

import { getUnresolvedNodesLibraryData } from "@flyde/stdlib/dist/nodes-library-data";

export function getLibraryData(): NodeLibraryData {
  const unresolved = getUnresolvedNodesLibraryData();

  return {
    ...unresolved,
    groups: unresolved.groups.map((g) => {
      return {
        ...g,
        nodes: g.nodes.map((node) => {
          const processed = processImprovedMacro(node);
          return macroNodeToDefinition(processed, "");
        }),
      };
    }),
  };
}
