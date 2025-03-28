import { codeNodeToImportableEditorNode, ImportableEditorNode } from "@flyde/core";
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
            const importableNode: ImportableEditorNode = {
              id: flow.node.id,
              type: "visual",
              displayName: flow.node.displayName,
              description: flow.node.description,
              aliases: flow.node.aliases,
              icon: flow.node.icon,
              source: { type: "package", data: pkgName },
              editorNode: flow.node as any,
            };
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
