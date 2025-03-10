import {
  MacrosDefCollection,
  NodesDefCollection,
  isMacroNode,
} from "@flyde/core";
import {
  deserializeFlow,
  isCodeNodePath,
  macroNodeToDefinition,
  resolveCodeNodeDependencies,
  resolveImportablePaths,
} from "@flyde/resolver";
import { readFileSync } from "fs";

export async function resolveDependentPackagesMacros(
  rootPath: string,
  flydeDependencies: string[]
) {
  return flydeDependencies.reduce<Record<string, MacrosDefCollection>>(
    (acc, dep) => {
      try {
        const paths = resolveImportablePaths(rootPath, dep);
        const nodes = paths.reduce((acc, filePath) => {
          if (isCodeNodePath(filePath)) {
            const obj = resolveCodeNodeDependencies(filePath).nodes.reduce(
              (obj, { node }) => {
                // Only include macro nodes
                if (isMacroNode(node)) {
                  return {
                    ...obj,
                    [node.id]: macroNodeToDefinition(node, filePath),
                  };
                }
                return obj;
              },
              {}
            );

            return { ...acc, ...obj };
          }
          try {
            const flow = deserializeFlow(
              readFileSync(filePath, "utf8"),
              filePath
            );
            // Only include macro nodes
            if (isMacroNode(flow.node)) {
              return { ...acc, [flow.node.id]: flow.node };
            }
            return acc;
          } catch (e) {
            console.error(`Skipping corrupt flow at ${filePath}, error: ${e}`);
            return acc;
          }
        }, {});
        return { ...acc, [dep]: nodes };
      } catch (e) {
        console.log(`skipping invalid dependency ${dep}`);
        return acc;
      }
    },
    {}
  );
}
