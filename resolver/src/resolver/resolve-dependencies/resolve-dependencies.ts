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
  isBasePart,
  BasePart,
} from "@flyde/core";
import { existsSync, readFileSync } from "fs";
import _ = require("lodash");
import { join } from "path";
import { deserializeFlow, deserializeFlowByPath } from "../../serdes";
import { ResolveMode, resolveFlowDependenciesByPath } from "../resolve-flow";
import { resolveImportablePaths } from "./resolve-importable-paths";
import { namespaceFlowImports } from "./namespace-flow-imports";

import * as StdLib from '@flyde/stdlib/dist/all';


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
      try {
        return resolveImportablePaths(fullFlowPath, importPath);
      } catch (e) {
        if (importPath !== '@flyde/stdlib') {
          throw new Error(`Cannot find module ${importPath} in ${fullFlowPath}`);
        }
        return [];
      }
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
    let result: {flow: FlydeFlow, source: ImportSource} = paths
      .reduce((acc, path) => {
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
          const flow = deserializeFlowByPath(path);
          return [...acc, { flow, source: { path, export: '__n/a__visual__' } }];
        }
      }, [])
      .filter((obj) => !!obj)
      .find((obj) => obj.flow.part.id === refPartId);

    if (!result) {

      if (importPath === '@flyde/stdlib') {
        const maybePartAndExport = Object.entries(StdLib)
          .filter(([key, value]) => isBasePart(value))
          .map(([key, value]) => ({part: value as CodePart, exportPath: key}))
          .find(({part}) => part.id === refPartId);
        if (!maybePartAndExport) {
          throw new Error(
            `Cannot find part ${refPartId} in ${importPath} (both external and built-in). It is imported by ${part.id} (${fullFlowPath})`
          );
        }

        deps[refPartId] = {
          ...maybePartAndExport.part,
          source: {
            path: importPath,
            export: maybePartAndExport.exportPath
          }
        };

      } else {
        throw new Error(
          `Cannot find part ${refPartId} in ${importPath}. It is imported by ${part.id} (${fullFlowPath})`
        );
      }
    } else {
      const { flow, source } = result;

      if (isCodePart(flow.part)) {
        deps[refPartId] = {
          ...flow.part,
          source
        };
      } else {
  
        const resolvedImport = resolveFlowDependenciesByPath(source.path, mode);
  
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

  }

  return deps;
}
