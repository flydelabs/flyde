import { join, relative } from "path";
import {
  isCodeNodePath,
  resolveCodeNodeDependencies,
  deserializeFlow,
  macroNodeToDefinition,
} from "@flyde/resolver";

import {
  BaseNode,
  debugLogger,
  isBaseNode,
  isInternalMacroNode,
  NodesDefCollection,
  ImportablesResult,
} from "@flyde/core";
import { scanFolderStructure } from "./scan-folders-structure";
import { FlydeFile } from "../fs-helper/shared";
import { getFlydeDependencies } from "./get-flyde-dependencies";
import { resolveDependentPackages } from "./resolve-dependent-packages";
import * as StdLib from "@flyde/stdlib/dist/all";
import { readFileSync } from "fs";

export interface CorruptScannedNode {
  type: "corrupt";
  error: string;
}

export async function scanImportableNodes(
  rootPath: string,
  filename: string
): Promise<ImportablesResult> {
  const fileRoot = join(rootPath, filename);

  const localFiles = getLocalFlydeFiles(rootPath);

  const depsNames = await getFlydeDependencies(rootPath);

  const depsNodes = await resolveDependentPackages(rootPath, depsNames);

  let builtInStdLib: Record<string, Record<string, BaseNode>> = {};
  if (!depsNames.includes("@flyde/stdlib")) {
    debugLogger("Using built-in stdlib");

    const nodes = Object.fromEntries(
      Object.entries(StdLib).filter((pair) => isBaseNode(pair[1]))
    ) as NodesDefCollection;
    builtInStdLib = {
      "@flyde/stdlib": nodes,
    };
  }

  let allErrors: ImportablesResult["errors"] = [];

  const localNodes = localFiles
    .filter((file) => !file.relativePath.endsWith(filename))
    .reduce<Record<string, Record<string, BaseNode>>>((acc, file) => {
      if (isCodeNodePath(file.fullPath)) {
        const { errors, nodes } = resolveCodeNodeDependencies(file.fullPath);
        allErrors.push(
          ...errors.map((err) => ({ path: file.fullPath, message: err }))
        );

        const nodesObj = nodes.reduce(
          (obj, { node }) => ({
            ...obj,
            [node.id]: isInternalMacroNode(node)
              ? macroNodeToDefinition(node, file.fullPath)
              : node,
          }),
          {}
        );
        const relativePath = relative(join(fileRoot, ".."), file.fullPath);
        acc[relativePath] ??= {};
        acc[relativePath] = {
          ...acc[relativePath],
          ...nodesObj,
        };

        return acc;
      }

      try {
        const flow = deserializeFlow(
          readFileSync(file.fullPath, "utf8"),
          file.fullPath
        );

        const relativePath = relative(join(fileRoot, ".."), file.fullPath);

        acc[relativePath] ??= {};
        acc[relativePath][flow.node.id] = flow.node;

        return acc;
      } catch (e) {
        allErrors.push({
          path: file.fullPath,
          message: e.message,
        });
        console.error(`Skipping corrupt flow at ${file.fullPath}, error: ${e}`);
        return acc;
      }
    }, {});

  return {
    importables: { ...builtInStdLib, ...depsNodes, ...localNodes },
    errors: allErrors,
  };
}

function getLocalFlydeFiles(rootPath: string) {
  const structure = scanFolderStructure(rootPath);

  const localFlydeFiles: FlydeFile[] = [];
  const queue = [...structure];
  while (queue.length) {
    const item = queue.pop();
    if (item.isFolder === true) {
      queue.push(...item.children);
    } else if (item.isFlyde || item.isFlydeCode) {
      localFlydeFiles.push(item as FlydeFile);
    }
  }

  return localFlydeFiles;
}
