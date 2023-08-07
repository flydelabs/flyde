import {
  VisualNode,
  isRefNodeInstance,
  isInlineNodeInstance,
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

const getRefNodeIds = (part: VisualNode): string[] => {
  const refNodeIds = part.instances
    .filter(isRefNodeInstance)
    .map((ins) => ins.nodeId);
  const inlineNodes = part.instances
    .filter(isInlineNodeInstance)
    .map((ins) => ins.part);

  const idsFromInline = inlineNodes.reduce<string[]>((acc, part) => {
    if (isVisualNode(part)) {
      acc.push(...getRefNodeIds(part));
    }
    return acc;
  }, []);

  return _.uniq([...refNodeIds, ...idsFromInline]);
};

export function resolveCodeNodeDependencies(path: string): {
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

export function isCodeNodePath(path: string): boolean {
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
  const refNodeIds = getRefNodeIds(part);

  let deps: ResolvedFlydeFlow["dependencies"] = {};

  for (const refNodeId of refNodeIds) {
    if (refNodeId === part.id) {
      // recursive call
      continue;
    }

    const importPath = inverseImports[refNodeId];
    if (!importPath) {
      throw new Error(
        `${part.id} in ${fullFlowPath} is using referenced part with id ${refNodeId} that is not imported`
      );
    }

    const paths = getLocalOrExternalPaths(importPath);

    // TODO - refactor the code below. It is unnecessarily complex and inefficient
    let result: { part: Node; source: ImportSource } | undefined = paths
      .reduce<{ part: Node; source: ImportSource }[]>((acc, path) => {
        if (isCodeNodePath(path)) {
          return [
            ...acc,
            ...resolveCodeNodeDependencies(path).parts.map(
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
      .find((obj) => obj.part.id === refNodeId);

    if (!result) {
      if (importPath === "@flyde/stdlib") {
        const maybeNodeAndExport = Object.entries(StdLib)
          .filter(([_, value]) => isBaseNode(value))
          .map(([key, value]) => ({ part: value as CodeNode, exportPath: key }))
          .find(({ part }) => part.id === refNodeId);
        if (!maybeNodeAndExport) {
          throw new Error(
            `Cannot find part ${refNodeId} in ${importPath} (both external and built-in). It is imported by ${part.id} (${fullFlowPath})`
          );
        }

        deps[refNodeId] = {
          ...maybeNodeAndExport.part,
          source: {
            path: importPath,
            export: maybeNodeAndExport.exportPath,
          },
        };
      } else {
        throw new Error(
          `Cannot find part ${refNodeId} in ${importPath}. It is imported by ${part.id} (${fullFlowPath})`
        );
      }
    } else {
      const { part, source } = result;

      if (isCodeNode(part)) {
        deps[refNodeId] = {
          ...part,
          source,
        };
      } else {
        const resolvedImport = resolveFlowDependenciesByPath(source.path, mode);

        const namespacedImport = namespaceFlowImports(
          resolvedImport,
          `${refNodeId}__`
        );

        deps = {
          ...deps,
          ...namespacedImport.dependencies,
          [refNodeId]: {
            ...namespacedImport.main,
            source,
          },
        };
      }
    }
  }

  const mainNode: ImportedNodeDef = {
    ...flow.part,
    source: { path: fullFlowPath, export: "n/a" },
  }; // TODO - fix the need for imported visual parts to declare an export source.

  return { ...deps, [mainNode.id]: mainNode };
}
