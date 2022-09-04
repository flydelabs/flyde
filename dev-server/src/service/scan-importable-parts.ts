import { dirname, join, relative } from "path";
import { deserializeFlow, resolveFlow, resolveImportablePaths } from "@flyde/runtime";

import * as pkgUp from "pkg-up";
import { PartDefinition, PartDefRepo } from "@flyde/core";
import { scanFolderStructure } from "./scan-folders-structure";
import { FlydeFile } from "../fs-helper/shared";
import { readFileSync } from "fs";

const FLYDE_STDLIB_PATTERN = /^\@flyde\/stdlib/;
const FLYDE_LIBRARY = /^flyde[-_](.*)/;

export const getFlydeDependencies = async (rootPath: string) => {
  const pjsonPath = await pkgUp({ cwd: rootPath });
  const { dependencies } = require(pjsonPath);

  const depKeys = Object.keys(dependencies) || [];
  return depKeys.filter((dep) => {
    return dep.match(FLYDE_STDLIB_PATTERN) || dep.match(FLYDE_LIBRARY);
  });
};

export const resolveDependentPackages = async (rootPath: string, flydeDependencies: string[]) => {
  return flydeDependencies.reduce<Record<string, PartDefRepo>>((acc, dep) => {
    const paths = resolveImportablePaths(rootPath, dep);

    const parts = paths.reduce((acc, filePath) => {
      const flow = resolveFlow(filePath, "definition");
      return (acc = { ...acc, ...flow });
    }, {});
    return { ...acc, [dep]: parts };

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
    } else if (item.isFlyde === true) {
      localFlydeFiles.push(item as FlydeFile);
    }
  }

  return localFlydeFiles;
};

export const scanImportableParts = async (rootPath: string, filename: string) => {
  const fileRoot = join(rootPath, filename);

  const localFiles = getLocalFlydeFiles(rootPath);
  const depsNames = await getFlydeDependencies(rootPath);
  const depsParts = await resolveDependentPackages(rootPath, depsNames);

  const localParts = localFiles
    .filter((file) => !file.relativePath.endsWith(filename))
    .reduce<Record<string, PartDefRepo>>((acc, file) => {
      const flowContents = readFileSync(file.fullPath, "utf8");
      const { exports } = deserializeFlow(flowContents);

      const resolvedFlow = resolveFlow(file.fullPath, "definition");

      const relativePath = relative(dirname(fileRoot), file.fullPath);

      const onlyExported = exports.reduce((acc, id) => {
        return { ...acc, [id]: resolvedFlow[id] };
      }, {});

      return { ...acc, [relativePath]: onlyExported };
    }, {});

  return { ...depsParts, ...localParts };
};
