import { join, relative } from "path";
import {
  isCodeNodePath,
  resolveCodeNodeDependencies,
  deserializeFlow,
  macroNodeToDefinition,
} from "@flyde/resolver";

import {
  debugLogger,
  isMacroNode,
  ImportablesResult,
  ImportableMacrosResult,
  MacrosDefCollection,
  MacroNode,
} from "@flyde/core";
import { scanFolderStructure } from "./scan-folders-structure";
import { FlydeFile } from "../fs-helper/shared";
import { getFlydeDependencies } from "./get-flyde-dependencies";
import * as StdLib from "@flyde/stdlib/dist/all";
import { resolveDependentPackagesMacros } from "./resolve-dependent-packages-macros";

export interface CorruptScannedNode {
  type: "corrupt";
  error: string;
}

export async function scanImportableMacros(
  rootPath: string,
  filename: string
): Promise<ImportableMacrosResult> {
  const fileRoot = join(rootPath, filename);

  const localFiles = getLocalFlydeFiles(rootPath);

  const depsNames = await getFlydeDependencies(rootPath);

  const depsNodes = await resolveDependentPackagesMacros(rootPath, depsNames);

  let builtInStdLib: Record<string, MacrosDefCollection> = {};
  if (!depsNames.includes("@flyde/stdlib")) {
    debugLogger("Using built-in stdlib");

    const nodes = Object.fromEntries(
      Object.entries(StdLib)
        .filter((pair) => isMacroNode(pair[1]))
        .map(([id, node]) => [
          id,
          macroNodeToDefinition(node as MacroNode<any>, ""),
        ])
    ) as MacrosDefCollection;
    builtInStdLib = {
      "@flyde/stdlib": nodes,
    };
  }

  let allErrors: ImportablesResult["errors"] = [];

  const localMacros = localFiles
    .filter((file) => !file.relativePath.endsWith(filename))
    .reduce<Record<string, MacrosDefCollection>>((acc, file) => {
      if (isCodeNodePath(file.fullPath)) {
        const { errors, nodes } = resolveCodeNodeDependencies(file.fullPath);
        allErrors.push(
          ...errors.map((err) => ({ path: file.fullPath, message: err }))
        );

        const nodesObj = nodes.reduce((obj, { node }) => {
          if (isMacroNode(node)) {
            obj[node.id] = macroNodeToDefinition(node, file.fullPath);
          }
          return obj;
        }, {});
        const relativePath = relative(join(fileRoot, ".."), file.fullPath);
        acc[relativePath] ??= {};
        acc[relativePath] = {
          ...acc[relativePath],
          ...nodesObj,
        };

        return acc;
      }

      return acc; // Skip non-code nodes
    }, {});

  return {
    importableMacros: { ...builtInStdLib, ...depsNodes, ...localMacros },
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
