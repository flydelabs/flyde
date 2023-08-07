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

const getRefNodeIds = (node: VisualNode): string[] => {
  const refNodeIds = node.instances
    .filter(isRefNodeInstance)
    .map((ins) => ins.nodeId);
  const inlineNodes = node.instances
    .filter(isInlineNodeInstance)
    .map((ins) => ins.node);

  const idsFromInline = inlineNodes.reduce<string[]>((acc, node) => {
    if (isVisualNode(node)) {
      acc.push(...getRefNodeIds(node));
    }
    return acc;
  }, []);

  return _.uniq([...refNodeIds, ...idsFromInline]);
};

export function resolveCodeNodeDependencies(path: string): {
  errors: string[];
  nodes: { exportName: string; node: CodeNode }[];
} {
  const errors = [];
  const nodes = [];

  try {
    let module = requireReload(path);
    if (isCodeNode(module)) {
      nodes.push({ exportName: "default", node: module });
    } else if (typeof module === "object") {
      Object.entries(module).forEach(([key, value]) => {
        if (isCodeNode(value)) {
          nodes.push({ exportName: key, node: value });
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
  return { errors, nodes };
}

export function isCodeNodePath(path: string): boolean {
  return /.(js|ts)x?$/.test(path);
}

export function resolveDependencies(
  flow: FlydeFlow,
  mode: ResolveMode,
  fullFlowPath: string
): ResolvedFlydeFlow["dependencies"] {
  const node = flow.node;

  const imports = flow.imports;

  const inverseImports = Object.entries(imports ?? {}).reduce((acc, curr) => {
    const [module, nodes] = curr;

    const obj = nodes.reduce(
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
  const refNodeIds = getRefNodeIds(node);

  let deps: ResolvedFlydeFlow["dependencies"] = {};

  for (const refNodeId of refNodeIds) {
    if (refNodeId === node.id) {
      // recursive call
      continue;
    }

    const importPath = inverseImports[refNodeId];
    if (!importPath) {
      throw new Error(
        `${node.id} in ${fullFlowPath} is using referenced node with id ${refNodeId} that is not imported`
      );
    }

    const paths = getLocalOrExternalPaths(importPath);

    // TODO - refactor the code below. It is unnecessarily complex and inefficient
    let result: { node: Node; source: ImportSource } | undefined = paths
      .reduce<{ node: Node; source: ImportSource }[]>((acc, path) => {
        if (isCodeNodePath(path)) {
          return [
            ...acc,
            ...resolveCodeNodeDependencies(path).nodes.map(
              ({ node, exportName }) => ({
                node,
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
            { node: flow.node, source: { path, export: "__n/a__visual__" } },
          ];
        }
      }, [])
      .filter((obj) => !!obj)
      .find((obj) => obj.node.id === refNodeId);

    if (!result) {
      if (importPath === "@flyde/stdlib") {
        const maybeNodeAndExport = Object.entries(StdLib)
          .filter(([_, value]) => isBaseNode(value))
          .map(([key, value]) => ({ node: value as CodeNode, exportPath: key }))
          .find(({ node }) => node.id === refNodeId);
        if (!maybeNodeAndExport) {
          throw new Error(
            `Cannot find node ${refNodeId} in ${importPath} (both external and built-in). It is imported by ${node.id} (${fullFlowPath})`
          );
        }

        deps[refNodeId] = {
          ...maybeNodeAndExport.node,
          source: {
            path: importPath,
            export: maybeNodeAndExport.exportPath,
          },
        };
      } else {
        throw new Error(
          `Cannot find node ${refNodeId} in ${importPath}. It is imported by ${node.id} (${fullFlowPath})`
        );
      }
    } else {
      const { node, source } = result;

      if (isCodeNode(node)) {
        deps[refNodeId] = {
          ...node,
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
    ...flow.node,
    source: { path: fullFlowPath, export: "n/a" },
  }; // TODO - fix the need for imported visual nodes to declare an export source.

  return { ...deps, [mainNode.id]: mainNode };
}
