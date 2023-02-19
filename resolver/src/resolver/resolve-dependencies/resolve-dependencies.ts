import {
  VisualPart,
  isRefPartInstance,
  isInlinePartInstance,
  isVisualPart,
  FlydeFlow,
  ResolvedFlydeFlow,
  isCodePart,
  CodePart,
  ImportSource,
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

export function resolveCodePartDependencies(path: string): {exportName: string, part: CodePart}[] {
  try {
    let module = require(path);

    if (isCodePart(module)) {
      return [{exportName: 'default', part: module}];
    } else {
      if (typeof module === "object") {
        return Object.entries<CodePart>(module)
          .filter(([_, value]) => isCodePart(value))
          .map(([key, value]) => ({exportName: key, part: value}));
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
    const result: {flow: FlydeFlow, source: ImportSource} = paths
      .reduce((acc, path) => {
        const contents = readFileSync(path, "utf-8");

        if (isCodePartPath(path)) {
          return [
            ...acc,
            ...resolveCodePartDependencies(path).map(({part, exportName}) => ({
              flow: { part, imports: {} },
              source: {
                path,
                export: exportName
              }
            })),
          ];
        } else {
          return [...acc, { flow: deserializeFlow(contents, path), source: { path, export: '__n/a__visual__' } }];
        }
      }, [])
      .filter((obj) => !!obj)
      .find((obj) => obj.flow.part.id === refPartId);

    if (!result) {
      throw new Error(
        `Cannot find part ${refPartId} in ${importPath}. It is imported by ${part.id} (${fullFlowPath})`
      );
    }

    const { flow, source } = result;

    if (isCodePart(flow.part)) {
      deps[refPartId] = {
        ...flow.part,
        source
      };
    } else {

      const resolvedImport = resolveFlow(source.path, mode);

      const namespacedImport = namespaceFlowImports(
        resolvedImport,
        `${refPartId}__`
      );

      deps = {
        ...deps,
        ...namespacedImport.dependencies,
        [refPartId]: {
          ...namespacedImport.main,
          source
        },
      };
    }
  }

  return deps;
}
