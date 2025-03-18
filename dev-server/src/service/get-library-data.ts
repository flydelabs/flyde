import { NodeLibraryData, processImprovedMacro } from "@flyde/core";

import { getUnresolvedNodesLibraryData } from "@flyde/stdlib/dist/nodes-library-data";

export function getLibraryData(): NodeLibraryData {
  const unresolved = getUnresolvedNodesLibraryData();

  return {
    ...unresolved,
    groups: unresolved.groups as any,
    // .map((g) => {
    //   return {
    //     ...g,
    //     nodes: g.nodes.map((node) => {
    //       const processed = processImprovedMacro(node);
    //       return macroNodeToDefinition(processed, "");
    //     }),
    //   };
    // }),
  };
}
