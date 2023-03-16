import { join, relative } from "path";
import { isCodePartPath, resolveCodePartDependencies, deserializeFlow } from "@flyde/resolver";

import { BasePart, debugLogger, isBasePart, PartDefRepo } from "@flyde/core";
import { scanFolderStructure } from "./scan-folders-structure";
import { FlydeFile } from "../fs-helper/shared";
import { getFlydeDependencies } from "./get-flyde-dependencies";
import { resolveDependentPackages } from "./resolve-dependent-packages";
import * as StdLib from '@flyde/stdlib/dist/all';
import { readFileSync } from "fs";

export async function scanImportableParts(
  rootPath: string,
  filename: string
): Promise<Record<string, PartDefRepo>> {
  const fileRoot = join(rootPath, filename);

  const localFiles = getLocalFlydeFiles(rootPath);
  
  const depsNames = await getFlydeDependencies(rootPath);

  const depsParts = await resolveDependentPackages(rootPath, depsNames);


  let builtInStdLib = {};
  if (!depsNames.includes('@flyde/stdlib')) {
    debugLogger('Using built-in stdlib');
    
    const parts = Object.values(StdLib)
    .filter(isBasePart) as BasePart[];
    builtInStdLib = {
      '@flyde/stdlib': parts
    }
  }

  const localParts = localFiles
    .filter((file) => !file.relativePath.endsWith(filename))
    .reduce<Record<string, PartDefRepo>>((acc, file) => {

      if (isCodePartPath(file.fullPath)) {
        const obj = resolveCodePartDependencies(file.fullPath).reduce((obj, {part}) => ({...obj, [part.id]: part}), {});
        const relativePath = relative(join(fileRoot, ".."), file.fullPath);
        return {...acc, [relativePath]: obj}
      }

      try {
        const flow = deserializeFlow(readFileSync(file.fullPath, "utf8"), file.fullPath);

        const relativePath = relative(join(fileRoot, ".."), file.fullPath);

        return { ...acc, [relativePath]: { [flow.part.id]: flow.part } };
      } catch (e) {
        console.error(`Skipping corrupt flow at ${file.fullPath}, error: ${e}`);
        return acc;
      }
    }, {});

  return { ...builtInStdLib, ...depsParts, ...localParts };
};


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
};