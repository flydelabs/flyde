import { NodeLibraryData, isMacroNode } from "@flyde/core";
import { getUnresolvedNodesLibraryData } from "@flyde/stdlib/dist/nodes-library-data";

export function getLibraryData(): NodeLibraryData {
  const unresolved = getUnresolvedNodesLibraryData();

  return {
    ...unresolved,
    groups: unresolved.groups.map((g) => {
      return {
        ...g,
        nodes: g.nodes.map((node) => {
          if (isMacroNode(node)) {
            return node as any; // solve files content concern here
          } else {
            return node;
          }
        }),
      };
    }),
  };
}
