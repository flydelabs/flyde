import {
  VisualNode,
  isRefNodeInstance,
  isInlineNodeInstance,
  isVisualNode,
  FlydeFlow,
  ResolvedFlydeFlow,
  isCodeNode,
  CodeNode,
  ImportedNodeDef,
  isMacroNode,
  ResolvedVisualNode,
  ResolvedDependencies,
  MacroNode,
  RefNodeInstance,
} from "@flyde/core";
import { existsSync } from "fs";
import _ = require("lodash");
import { join } from "path";
import { ResolveMode, resolveFlowDependenciesByPath } from "../resolve-flow";
import { resolveImportablePaths } from "./resolve-importable-paths";
import { namespaceFlowImports } from "./namespace-flow-imports";

import * as StdLib from "@flyde/stdlib/dist/all";

import requireReload from "require-reload";

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
  mode: ResolveMode,
  fullFlowPath: string
): ResolvedFlydeFlow {
  const node = flow.node;

  const imports = flow.imports;

  function resolveAndProcessVisualNode(
    visualNode: VisualNode,
    namespace = "",
    dependencies = {}
  ): {
    resolvedNode: ResolvedVisualNode;
    dependencies: ResolvedFlydeFlow["dependencies"];
  } {
    const { instances } = visualNode;
    let gatheredDependencies = { ...dependencies };

    const inverseImports = Object.entries(imports ?? {}).reduce((acc, curr) => {
      const [module, nodes] = curr;

      const obj = nodes.reduce(
        (acc, curr) => ({ ...acc, [curr as string]: module }),
        {}
      );
      return { ...acc, ...obj };
    }, {});
    for (const instance of instances) {
      if (isInlineNodeInstance(instance)) {
        const inlineNode = instance.node;
        const resolved = resolveAndProcessVisualNode(
          inlineNode,
          namespace,
          gatheredDependencies
        );
        gatheredDependencies = {
          ...gatheredDependencies,
          ...resolved.dependencies,
        };
      } else if (isRefNodeInstance(instance)) {
        const { nodeId } = instance;

        if (nodeId === visualNode.id) {
          continue; // recursive call
        }

        const importPath = inverseImports[nodeId];

        if (!importPath) {
          throw new Error(
            `${node.id} in ${fullFlowPath} is using referenced node with id ${nodeId} that is not imported`
          );
        }

        let found = false;

        const paths = getLocalOrPackagePaths(fullFlowPath, importPath);

        // Look for the referenced node in each possible file it might be in
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
              const resolvedImport = resolveFlowDependenciesByPath(
                importPath,
                mode
              );

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

            // deps[]
            // this should be a visual flow
          }
        }

        if (!found) {
          if (importPath === "@flyde/stdlib" && StdLib[nodeId]) {
            gatheredDependencies[nodeId] = {
              ...StdLib[nodeId],
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
      } else {
        const { macroId, macroData } = instance;
        const importPath = inverseImports[macroId];

        if (!importPath) {
          throw new Error(
            `${node.id} in ${fullFlowPath} is using referenced macro node with id ${macroId} that is not imported`
          );
        }

        const paths = getLocalOrPackagePaths(fullFlowPath, importPath);

        let found = false;

        // Look for the referenced node in each possible file it might be in
        for (const importPath of paths) {
          if (isCodeNodePath(importPath)) {
            const { errors, nodes } = resolveMacroNodesDependencies(importPath);
            const targetMacro = nodes.find(({ node }) => node.id === macroId);

            if (targetMacro) {
              if (!isMacroNode(targetMacro.node)) {
                console.warn(
                  `Found node ${macroId} in ${importPath}, but it is not a macro node`
                );
                continue;
              }
              const metaData = targetMacro.node.definitionBuilder(macroData);
              const runFn = targetMacro.node.runFnBuilder(macroData);

              console.log(macroData);

              console.log(metaData.outputs);

              const id = `${namespace}${macroId}__${instance.id}`;
              const resolvedNode: CodeNode = {
                ...metaData,
                id,
                run: runFn,
              };

              gatheredDependencies[id] = {
                ...resolvedNode,
                source: {
                  path: importPath,
                  export: targetMacro.exportName,
                },
              };

              console.log("resolvedNode", resolvedNode);

              delete instance.macroId;
              delete instance.macroData;
              (instance as any as RefNodeInstance).nodeId = id;

              found = true;
              break;
            } else {
              if (errors.length) {
                console.warn(
                  `Could not find ${macroId} in ${importPath}. The following errors were thrown, and might be the reason the node is not properly resolved. Errors: ${errors.join(
                    ", "
                  )}`
                );
              }
            }
          }
        }

        if (!found) {
          throw new Error(
            `Could not find macro node ${macroId} in ${importPath}. It is imported by ${node.id} (${fullFlowPath})`
          );
        }
      }
    }

    return {
      resolvedNode: visualNode as ResolvedVisualNode,
      dependencies: gatheredDependencies,
    };
  }

  const { resolvedNode, dependencies } = resolveAndProcessVisualNode(node);

  const mainNode: ImportedNodeDef = {
    ...flow.node,
    source: { path: fullFlowPath, export: "n/a" },
  }; // TODO - fix the need for imported visual nodes to declare an export source.

  return {
    main: resolvedNode,
    dependencies: {
      ...dependencies,
      [mainNode.id]: mainNode,
    },
  };
}

function resolveCodeNodeDependencies(path: string): {
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
        } else if (isMacroNode(value)) {
          throw new Error(`Macro nodes are not supported yet`);
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

function resolveMacroNodesDependencies(path: string): {
  errors: string[];
  nodes: { exportName: string; node: MacroNode<any> }[];
} {
  const errors = [];
  const nodes = [];

  try {
    let module = requireReload(path);
    if (isMacroNode(module)) {
      nodes.push({ exportName: "default", node: module });
    } else if (typeof module === "object") {
      Object.entries(module).forEach(([key, value]) => {
        if (isMacroNode(value)) {
          nodes.push({ exportName: key, node: value });
        } else if (isMacroNode(value)) {
          throw new Error(`Macro nodes are not supported yet`);
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
