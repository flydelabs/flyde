import { join, relative } from "path";
import { resolveFlow, resolveImportablePaths, isCodePartPath, resolveCodePartDependencies } from "@flyde/resolver";

import * as pkgUp from "pkg-up";
import { PartDefRepo } from "@flyde/core";
import { scanFolderStructure } from "./scan-folders-structure";
import { FlydeFile } from "../fs-helper/shared";

const FLYDE_PACKAGE_PATTERN = /^\@flyde\/(.*)/;
const FLYDE_LIBRARY = /^flyde[-_](.*)/;

export const getFlydeDependencies = async (rootPath: string) => {
  const pjsonPath = await pkgUp({ cwd: rootPath });
  const { dependencies, devDependencies } = require(pjsonPath);
  const combinedDeps = { ...dependencies, ...devDependencies };

  const depKeys = Object.keys(combinedDeps) || [];
  return depKeys.filter((dep) => {
    return dep.match(FLYDE_PACKAGE_PATTERN) || dep.match(FLYDE_LIBRARY);
  });
};

export const resolveDependentPackages = async (
  rootPath: string,
  flydeDependencies: string[]
) => {
  return flydeDependencies.reduce<Record<string, PartDefRepo>>((acc, dep) => {
    try {
      const paths = resolveImportablePaths(rootPath, dep);
      const parts = paths.reduce((acc, filePath) => {

        if (isCodePartPath(filePath))  {
          const obj = resolveCodePartDependencies(filePath).reduce((obj, part) => ({...obj, [part.id]: part}), {});
          return {...acc, ...obj}
        }
        try {
          const { main } = resolveFlow(filePath, "definition");
          return { ...acc, [main.id]: main };
        } catch (e) {
          console.error(`Skipping corrupt flow at ${filePath}, error: ${e}`);
          return acc;
        }
      }, {});
      return { ...acc, [dep]: parts };
    } catch (e) {
      console.log(`skipping invalid dependency ${dep}`);
      return acc;
    }
    // return acc;
  }, {});
};

const getLocalFlydeFiles = (rootPath: string) => {
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

export const scanImportableParts = async (
  rootPath: string,
  filename: string
) => {
  const fileRoot = join(rootPath, filename);

  const localFiles = getLocalFlydeFiles(rootPath);

  const depsNames = await getFlydeDependencies(rootPath);

  const depsParts = await resolveDependentPackages(rootPath, depsNames);

  const localParts = localFiles
    .filter((file) => !file.relativePath.endsWith(filename))
    .reduce<Record<string, PartDefRepo>>((acc, file) => {
      // const flowContents = readFileSync(file.fullPath, "utf8");

      try {
        const { main } = resolveFlow(file.fullPath, "definition");

        const relativePath = relative(join(fileRoot, ".."), file.fullPath);

        return { ...acc, [relativePath]: { [main.id]: main } };
        // return { ...acc, [main.id]: main };
      } catch (e) {
        console.error(`Skipping corrupt flow at ${file.fullPath}, error: ${e}`);
        return acc;
      }
    }, {});

  return { ...depsParts, ...localParts };
};
