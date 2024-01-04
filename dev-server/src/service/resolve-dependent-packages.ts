import { NodesDefCollection, isMacroNode } from "@flyde/core";
import {
  deserializeFlow,
  isCodeNodePath,
  macroNodeToDefinition,
  resolveCodeNodeDependencies,
  resolveImportablePaths,
} from "@flyde/resolver";
import { readFileSync } from "fs";

export async function resolveDependentPackages(
  rootPath: string,
  flydeDependencies: string[]
) {
  return flydeDependencies.reduce<Record<string, NodesDefCollection>>(
    (acc, dep) => {
      try {
        const paths = resolveImportablePaths(rootPath, dep);
        const nodes = paths.reduce((acc, filePath) => {
          if (isCodeNodePath(filePath)) {
            const obj = resolveCodeNodeDependencies(filePath).nodes.reduce(
              (obj, { node }) => {
                return {
                  ...obj,
                  [node.id]: isMacroNode(node)
                    ? macroNodeToDefinition(node, filePath)
                    : node,
                };
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
            return { ...acc, [flow.node.id]: flow.node };
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
      // return acc;
    },
    {}
  );
}
