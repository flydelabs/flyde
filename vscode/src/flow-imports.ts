import { dirname, isAbsolute, normalize, relative, resolve } from "path";
import type { FlydeFlow } from "@flyde/core";

const toComparablePath = (value: string) => normalize(resolve(value));

const toImportPath = (value: string) => {
  const normalized = value.replace(/\\/g, "/");
  return normalized.startsWith(".") ? normalized : `./${normalized}`;
};

/** Updates file-based node imports when their target file is moved. */
export function updateFlowImportForRename(
  flow: FlydeFlow,
  importingFilePath: string,
  oldTargetPath: string,
  newTargetPath: string,
): boolean {
  const oldTarget = toComparablePath(oldTargetPath);
  let changed = false;

  for (const instance of flow.node.instances) {
    if (instance.source?.type !== "file" || typeof instance.source.data !== "string") {
      continue;
    }

    const data = instance.source.data;
    const resolvedTarget = isAbsolute(data)
      ? toComparablePath(data)
      : toComparablePath(resolve(dirname(importingFilePath), data));

    if (resolvedTarget !== oldTarget) continue;

    const nextData = toImportPath(relative(dirname(importingFilePath), newTargetPath));
    if (nextData !== data) {
      instance.source.data = nextData;
      changed = true;
    }
  }

  return changed;
}
