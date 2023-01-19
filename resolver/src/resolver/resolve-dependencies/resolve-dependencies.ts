import {
  VisualPart,
  isRefPartInstance,
  isInlinePartInstance,
  isVisualPart,
  FlydeFlow,
  ResolvedFlydeFlow,
  isCodePart,
  CodePart,
} from "@flyde/core";
import { existsSync, readFileSync } from "fs";
import _ = require("lodash");
import { join } from "path";
import { deserializeFlow } from "../../serdes";
import { ResolveMode, resolveFlow } from "../resolve-flow";
import { resolveImportablePaths } from "./resolve-importable-paths";
import { namespaceFlowImports } from "./namespace-flow-imports";


const getRefPartIds = (part: VisualPart): string[] => {
  const refPartIds = part.instances
    .filter(isRefPartInstance)
    .map((ins) => ins.partId);
  const inlineParts = part.instances
    .filter(isInlinePartInstance)
    .map((ins) => ins.part);

  const idsFromInline = inlineParts.reduce((acc, part) => {
    if (isVisualPart(part)) {
      acc.push(...getRefPartIds(part));
    }
    return acc;
  }, []);

  return _.uniq([...refPartIds, ...idsFromInline]);
};

export function resolveCodePartDependencies(path: string): CodePart[] {
  try {
    let part = require(path);

    if (isCodePart(part)) {
      return [part];
    } else {
      if (typeof part === "object") {
        return Object.values(part).filter(isCodePart);
      }
    }
  } catch (e) {
    console.error(`Error loading code part at ${path}`, e);
    throw new Error(`Error loading code part at ${path} - ${e}`);
  }
}

export function isCodePartPath (path: string): boolean {
  return /.(js|ts)x?$/.test(path)
}

export function resolveDependencies(
  flow: FlydeFlow,
  mode: ResolveMode,
  fullFlowPath: string
): ResolvedFlydeFlow["dependencies"] {
  const part = flow.part;

  const imports = flow.imports;

  const inverseImports = Object.entries(imports).reduce((acc, curr) => {
    const [module, parts] = curr;

    const obj = parts.reduce(
      (acc, curr) => ({ ...acc, [curr as string]: module }),
      {}
    );
    return { ...acc, ...obj };
  }, {});

  const getLocalOrExternalPaths = (importPath: string) => {
    const fullImportPath = join(fullFlowPath, "..", importPath);

    if (existsSync(fullImportPath)) {
      return [fullImportPath];
    } else {
      return resolveImportablePaths(fullFlowPath, importPath);
    }
  };
  const refPartIds = getRefPartIds(part);

  let deps: ResolvedFlydeFlow["dependencies"] = {};

  for (const refPartId of refPartIds) {
    if (refPartId === part.id) {
      // recursive call
      continue;
    }

    const importPath = inverseImports[refPartId];
    if (!importPath) {
      throw new Error(
        `${part.id} in ${fullFlowPath} is using referenced part with id ${refPartId} that is not imported`
      );
    }

    const paths = getLocalOrExternalPaths(importPath);

    // TODO - refactor the code below. It is unnecessarily complex and inefficient
    const result = paths
      .reduce((acc, path) => {
        const contents = readFileSync(path, "utf-8");

        if (isCodePartPath(path)) {
          return [
            ...acc,
            ...resolveCodePartDependencies(path).map((part) => ({
              flow: { part, imports: {} },
              path,
            })),
          ];
        } else {
          return [...acc, { flow: deserializeFlow(contents, path), path }];
        }
      }, [])
      .filter((obj) => !!obj)
      .find((obj) => obj.flow.part.id === refPartId);

    if (!result) {
      throw new Error(
        `Cannot find part ${refPartId} in ${importPath}. It is imported by ${part.id} (${fullFlowPath})`
      );
    }

    const { flow, path } = result;

    if (isCodePart(flow.part)) {
      deps[refPartId] = {
        ...flow.part,
        importPath: path,
      };
    } else {
      console.log(path);

      const resolvedImport = resolveFlow(path, mode);

      const namespacedImport = namespaceFlowImports(
        resolvedImport,
        `${refPartId}__`
      );

      deps = {
        ...deps,
        ...namespacedImport.dependencies,
        [refPartId]: {
          ...namespacedImport.main,
          importPath: path,
        },
      };
    }
  }

  return deps;
}
