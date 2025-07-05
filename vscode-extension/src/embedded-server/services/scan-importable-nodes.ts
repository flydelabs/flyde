import { join, relative } from "path";
import {
  isCodeNodePath,
  resolveCodeNodeDependencies,
  deserializeFlow,
} from "@flyde/resolver";

import {
  BaseNode,
  debugLogger,
  isCodeNode,
  ImportableEditorNode,
  CodeNode,
  visualNodeToImportableEditorNode,
  codeNodeToImportableEditorNode,
} from "@flyde/core";

import { FlydeFile } from "../fs-helper/shared";
import { getFlydeDependencies } from "./get-flyde-dependencies";
import { resolveDependentPackages } from "./resolve-dependent-packages";
import * as StdLib from "@flyde/stdlib/dist/all";
import { readFileSync } from "fs";
import { scanFolderStructure } from "./scan-folders-structure";

export interface CorruptScannedNode {
  type: "corrupt";
  error: string;
}

export async function scanImportableNodes(
  rootPath: string,
  relativePath: string
): Promise<{
  nodes: ImportableEditorNode[];
  errors: { path: string; message: string }[];
}> {
  const fileRoot = join(rootPath, relativePath);

  const localFiles = getLocalFlydeFiles(rootPath);

  const depsNames = await getFlydeDependencies(rootPath);

  const depsNodes = await resolveDependentPackages(rootPath, depsNames);

  let builtInStdLib: Record<string, ImportableEditorNode[]> = {};
  if (!depsNames.includes("@flyde/stdlib")) {
    debugLogger("Using built-in stdlib");

    const nodes = Object.fromEntries(
      Object.entries(StdLib)
        .filter((pair): pair is [string, CodeNode] => isCodeNode(pair[1]))
        .map<[string, ImportableEditorNode]>(([id, node]) => [
          id,
          codeNodeToImportableEditorNode(node, {
            type: "package",
            data: "@flyde/stdlib",
          }),
        ])
    );
    builtInStdLib = {
      "@flyde/stdlib": Object.values(nodes),
    };
  }

  let allErrors: { path: string; message: string }[] = [];

  const localNodes = localFiles
    .filter((file) => !file.relativePath.endsWith(relativePath))
    .reduce<Record<string, ImportableEditorNode[]>>((acc, file) => {
      if (isCodeNodePath(file.fullPath)) {
        const { errors, nodes } = resolveCodeNodeDependencies(file.fullPath);
        allErrors.push(
          ...errors.map((err) => ({ path: file.fullPath, message: err }))
        );

        const nodesObj: ImportableEditorNode[] = nodes.map(({ node }) => {
          const relativePath = relative(join(fileRoot, ".."), file.fullPath);

          const importableNode = codeNodeToImportableEditorNode(node, {
            type: "file",
            data: relativePath,
          });
          return importableNode;
        });

        const relativePath = relative(join(fileRoot, ".."), file.fullPath);
        acc[relativePath] ??= [];
        acc[relativePath] = [...acc[relativePath], ...nodesObj];

        return acc;
      }

      try {
        const flow = deserializeFlow(
          readFileSync(file.fullPath, "utf8"),
          file.fullPath
        );

        const relativePath = relative(join(fileRoot, ".."), file.fullPath);

        acc[relativePath] ??= [];

        const importableNode = visualNodeToImportableEditorNode(flow.node, {
          type: "file",
          data: file.fullPath,
        });
        acc[relativePath].push(importableNode);

        return acc;
      } catch (e) {
        allErrors.push({
          path: file.fullPath,
          message: e instanceof Error ? e.message : String(e),
        });
        console.error(`Skipping corrupt flow at ${file.fullPath}, error: ${e}`);
        return acc;
      }
    }, {});

  const depNodesFlat = Object.values(depsNodes).flat();
  const localNodesFlat = Object.values(localNodes).flat();
  const builtInStdLibFlat = Object.values(builtInStdLib).flat();

  return {
    nodes: [...builtInStdLibFlat, ...depNodesFlat, ...localNodesFlat],

    errors: allErrors,
  };
}

function getLocalFlydeFiles(rootPath: string) {
  const structure = scanFolderStructure(rootPath);

  const localFlydeFiles: FlydeFile[] = [];
  const queue = [...structure];
  while (queue.length) {
    const item = queue.pop();
    if (item && 'isFolder' in item && item.isFolder === true) {
      queue.push(...('children' in item ? item.children : []));
    } else if (item && 'isFlyde' in item && (item.isFlyde || ('isFlydeCode' in item && item.isFlydeCode))) {
      localFlydeFiles.push(item as FlydeFile);
    }
  }

  return localFlydeFiles;
}