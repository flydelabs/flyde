import {
  VisualNode,
  FlydeFlow,
  ResolvedFlydeFlow,
  isCodeNode,
  ImportedNodeDef,
  isVisualNode,
  CodeNode,
  isVisualNodeInstance,
  ResolvedDependencies,
  InternalVisualNode,
} from "@flyde/core";

import { namespaceFlowImports } from "./namespace-flow-imports";
import { existsSync, readFileSync } from "fs";
import _ = require("lodash");
import { join } from "path";
import { resolveFlowByPath } from "../resolve-flow";
import { resolveImportablePaths } from "./resolve-importable-paths";

import * as _StdLib from "@flyde/stdlib/dist/all";
import requireReload from "require-reload";

const LocalStdLib = Object.values(_StdLib).reduce<Record<string, CodeNode>>(
  (acc, curr) => {
    if (isCodeNode(curr)) {
      return { ...acc, [curr.id]: curr };
    } else {
      return acc;
    }
  },
  {}
);

const getLocalOrPackagePaths = (fullFlowPath: string, importPath: string) => {
  const fullImportPath = join(fullFlowPath, "..", importPath);

  if (existsSync(fullImportPath)) {
    return [fullImportPath];
  } else {
    try {
      return resolveImportablePaths(fullFlowPath, importPath);
    } catch (e) {
      if (importPath !== "@flyde/stdlib") {
        throw new Error(`Cannot find module ${importPath} in ${fullFlowPath}`);
      }
      return [];
    }
  }
};

/*
Recursively resolve all dependencies of a flow (direct and transitive). Also processes macro nodes:
1. For each node instance of the main node:
   a. if it's a referenced node, resolve it by looking up the import path and recursively resolving it
   b. if it's an inline node, recursively resolve it
   c. if it's a macro node, compute its value and replace it with the result
*/

export function resolveFlow(
  flow: FlydeFlow,
  fullFlowPath: string
): ResolvedFlydeFlow {
  const node = flow.node;

  function resolveAndProcessVisualNode(
    visualNode: VisualNode,
    namespace = "",
    dependencies = {}
  ): {
    resolvedNode: InternalVisualNode;
    dependencies: ResolvedFlydeFlow["dependencies"];
  } {
    const { instances } = visualNode;
    let gatheredDependencies = { ...dependencies };

    for (const instance of instances) {
      if (isVisualNodeInstance(instance) && instance.source.type === "inline") {
        const inlineNode = instance.source.data;
        if (isVisualNode(inlineNode)) {
          const resolved = resolveAndProcessVisualNode(
            inlineNode,
            namespace,
            gatheredDependencies
          );
          gatheredDependencies = {
            ...gatheredDependencies,
            ...resolved.dependencies,
          };
        }
      } else {
        const { nodeId } = instance;

        if (nodeId === visualNode.id) {
          continue; // recursive call
        }

        if (
          !instance.source ||
          (instance.source.type !== "file" &&
            instance.source.type !== "package")
        ) {
          throw new Error(
            `${node.id} in ${fullFlowPath} has instance with id ${instance.id} that has invalid source property`
          );
        }

        const importPath = instance.source.data;
        let found = false;

        const paths = getLocalOrPackagePaths(fullFlowPath, importPath);

        for (const importPath of paths) {
          if (isCodeNodePath(importPath)) {
            const { errors, nodes } = resolveCodeNodeDependencies(importPath);
            const targetNode = nodes.find(({ node }) => node.id === nodeId);

            if (targetNode) {
              gatheredDependencies[nodeId] = {
                ...targetNode.node,
                source: {
                  path: importPath,
                  export: targetNode.exportName,
                },
              };
              found = true;
              break;
            } else {
              if (errors.length) {
                console.warn(
                  `Could not find ${nodeId} in ${importPath}. The following errors were thrown, and might be the reason the node is not properly resolved. Errors: ${errors.join(
                    ", "
                  )}`
                );
              }
            }
          } else {
            try {
              const resolvedImport = resolveFlowByPath(importPath);

              const namespacedImport = namespaceFlowImports(
                resolvedImport,
                `${nodeId}__`
              );

              gatheredDependencies = {
                ...gatheredDependencies,
                ...namespacedImport.dependencies,
                [namespacedImport.main.id]: namespacedImport.main,
              };

              found = true;
            } catch (e) {
              console.warn(
                `Could not find ${nodeId} in ${importPath}. The following error was thrown, and might be the reason the node is not properly resolved. Error: ${e.message}`
              );
            }
          }
        }

        if (!found) {
          if (importPath === "@flyde/stdlib" && LocalStdLib[nodeId]) {
            gatheredDependencies[nodeId] = {
              ...LocalStdLib[nodeId],
              source: {
                path: importPath,
                export: nodeId,
              },
            };
          } else {
            throw new Error(
              `Could not find node ${nodeId} in ${importPath}. It is imported by ${node.id} (${fullFlowPath})`
            );
          }
        }
      }
    }

    return {
      resolvedNode: visualNode,
      dependencies: gatheredDependencies,
    };
  }

  const { resolvedNode, dependencies } = resolveAndProcessVisualNode(node);

  return {
    main: resolvedNode,
    dependencies: {
      ...(dependencies as ResolvedDependencies),
      [resolvedNode.id]: resolvedNode,
    },
  };
}

export function findTypeScriptSource(jsPath: string): string | null {
  if (!jsPath.includes("/dist/") || !jsPath.endsWith(".js")) {
    return null;
  }

  const potentialTsPath = jsPath
    .replace("/dist/", "/src/")
    .replace(/\.js$/, ".ts");

  try {
    return readFileSync(potentialTsPath, "utf-8");
  } catch {
    return null;
  }
}

export function resolveCodeNodeDependencies(path: string): {
  errors: string[];
  nodes: {
    exportName: string;
    node: CodeNode<any>;
  }[];
} {
  const errors = [];
  const nodes = [];

  try {
    let module = requireReload(path);
    // Try to find TypeScript source if it's a JS file in dist
    const sourceCode =
      findTypeScriptSource(path) || readFileSync(path, "utf-8");

    if (isCodeNode(module)) {
      nodes.push({
        exportName: "default",
        node: {
          ...module,
          sourceCode,
        },
      });
    } else if (typeof module === "object") {
      Object.entries(module).forEach(([key, value]) => {
        if (isCodeNode(value)) {
          nodes.push({
            exportName: key,
            node: {
              ...value,
              sourceCode,
            },
          });
        }
      });
    }
  } catch (e) {
    errors.push(`Error loading module "${path}": ${e.message}`);
  }
  return { errors, nodes };
}

export function isCodeNodePath(path: string): boolean {
  return /.(js|ts)x?$/.test(path);
}
