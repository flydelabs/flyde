import {
  VisualNode,
  isRefPartInstance,
  isInlinePartInstance,
  isVisualNode,
  FlydeFlow,
  ResolvedFlydeFlow,
  isCodeNode,
  CodeNode,
  ImportSource,
  isBaseNode,
  Node,
  ImportedNodeDef,
} from "@flyde/core";
import { existsSync } from "fs";
import _ = require("lodash");
import { join } from "path";
import { deserializeFlowByPath } from "../../serdes";
import { ResolveMode, resolveFlowDependenciesByPath } from "../resolve-flow";
import { resolveImportablePaths } from "./resolve-importable-paths";
import { namespaceFlowImports } from "./namespace-flow-imports";

import requireReload from "require-reload";

import * as StdLib from "@flyde/stdlib/dist/all";

const getRefPartIds = (part: VisualNode): string[] => {
  const refPartIds = part.instances
    .filter(isRefPartInstance)
    .map((ins) => ins.partId);
  const inlineNodes = part.instances
    .filter(isInlinePartInstance)
    .map((ins) => ins.part);

  const idsFromInline = inlineNodes.reduce<string[]>((acc, part) => {
    if (isVisualNode(part)) {
      acc.push(...getRefPartIds(part));
    }
    return acc;
  }, []);

  return _.uniq([...refPartIds, ...idsFromInline]);
};

export function resolveCodePartDependencies(path: string): {
  errors: string[];
  parts: { exportName: string; part: CodeNode }[];
} {
  const errors = [];
  const parts = [];

  try {
    let module = requireReload(path);
    if (isCodeNode(module)) {
      parts.push({ exportName: "default", part: module });
    } else if (typeof module === "object") {
      Object.entries(module).forEach(([key, value]) => {
        if (isCodeNode(value)) {
          parts.push({ exportName: key, part: value });
        } else {
          errors.push(`Exported value "${key}" is not a valid CodeNode`);
        }
      });
    } else {
      errors.push(`Exported value is not a valid CodeNode`);
    }
  } catch (e) {
    errors.push(`Error loading module "${path}": ${e.message}`);
  }
  return { errors, parts };
}

export function isCodePartPath(path: string): boolean {
  return /.(js|ts)x?$/.test(path);
}

export function resolveDependencies(
  flow: FlydeFlow,
  mode: ResolveMode,
  fullFlowPath: string
): ResolvedFlydeFlow["dependencies"] {
  const part = flow.part;

  const imports = flow.imports;

  const inverseImports = Object.entries(imports ?? {}).reduce((acc, curr) => {
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
        if (importPath !== "@flyde/stdlib") {
          throw new Error(
            `Cannot find module ${importPath} in ${fullFlowPath}`
          );
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
    let result: { part: Node; source: ImportSource } | undefined = paths
      .reduce<{ part: Node; source: ImportSource }[]>((acc, path) => {
        if (isCodePartPath(path)) {
          return [
            ...acc,
            ...resolveCodePartDependencies(path).parts.map(
              ({ part, exportName }) => ({
                part,
                source: {
                  path,
                  export: exportName,
                },
              })
            ),
          ];
        } else {
          const flow = deserializeFlowByPath(path);
          return [
            ...acc,
            { part: flow.part, source: { path, export: "__n/a__visual__" } },
          ];
        }
      }, [])
      .filter((obj) => !!obj)
      .find((obj) => obj.part.id === refPartId);

    if (!result) {
      if (importPath === "@flyde/stdlib") {
        const maybePartAndExport = Object.entries(StdLib)
          .filter(([_, value]) => isBaseNode(value))
          .map(([key, value]) => ({ part: value as CodeNode, exportPath: key }))
          .find(({ part }) => part.id === refPartId);
        if (!maybePartAndExport) {
          throw new Error(
            `Cannot find part ${refPartId} in ${importPath} (both external and built-in). It is imported by ${part.id} (${fullFlowPath})`
          );
        }

        deps[refPartId] = {
          ...maybePartAndExport.part,
          source: {
            path: importPath,
            export: maybePartAndExport.exportPath,
          },
        };
      } else {
        throw new Error(
          `Cannot find part ${refPartId} in ${importPath}. It is imported by ${part.id} (${fullFlowPath})`
        );
      }
    } else {
      const { part, source } = result;

      if (isCodeNode(part)) {
        deps[refPartId] = {
          ...part,
          source,
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
            source,
          },
        };
      }
    }
  }

  const mainPart: ImportedNodeDef = {
    ...flow.part,
    source: { path: fullFlowPath, export: "n/a" },
  }; // TODO - fix the need for imported visual parts to declare an export source.

  return { ...deps, [mainPart.id]: mainPart };
}
