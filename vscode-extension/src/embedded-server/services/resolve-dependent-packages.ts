import { codeNodeToImportableEditorNode, ImportableEditorNode, visualNodeToImportableEditorNode } from "@flyde/core";
import {
  deserializeFlow,
  isCodeNodePath,
  resolveCodeNodeDependencies,
  resolveImportablePaths,
} from "@flyde/resolver";
import { readFileSync } from "fs";

export async function resolveDependentPackages(
  rootPath: string,
  flydeDependencies: string[]
) {
  return flydeDependencies.reduce<Record<string, ImportableEditorNode[]>>(
    (acc, pkgName) => {
      try {
        const paths = resolveImportablePaths(rootPath, pkgName);
        const nodes = paths.reduce<ImportableEditorNode[]>((acc, filePath) => {
          if (isCodeNodePath(filePath)) {
            const obj = resolveCodeNodeDependencies(filePath).nodes.map(
              ({ node: _node }) => {
                return codeNodeToImportableEditorNode(_node, {
                  type: "package",
                  data: pkgName
                });
              }
            );

            return [...acc, ...obj];
          }
          try {
            const flow = deserializeFlow(
              readFileSync(filePath, "utf8"),
              filePath
            );
            const importableNode = visualNodeToImportableEditorNode(flow.node, {
              type: "package",
              data: pkgName,
            });
            return { ...acc, [flow.node.id]: importableNode };
          } catch (e) {
            console.error(`Skipping corrupt flow at ${filePath}, error: ${e}`);
            return acc;
          }
        }, []);
        return { ...acc, [pkgName]: nodes };
      } catch (e) {
        console.log(`skipping invalid dependency ${pkgName}`);
        return acc;
      }
      // return acc;
    },
    {}
  );
}
