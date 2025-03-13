import {
  VisualNode,
  isRefNodeInstance,
  isInlineNodeInstance,
  FlydeFlow,
  ResolvedFlydeFlow,
  isCodeNode,
  ImportedNodeDef,
  isInternalMacroNode,
  ResolvedVisualNode,
  InternalMacroNode,
  isVisualNode,
  ResolvedFlydeFlowDefinition,
  ResolvedMacroNodeInstance,
  isMacroNodeInstance,
  processMacroNodeInstance,
  processImprovedMacro,
  CodeNode,
  isAdvancedMacroNode,
} from "@flyde/core";
import { existsSync, readFileSync } from "fs";
import _ = require("lodash");
import { join } from "path";
import { ResolveMode, resolveFlowByPath } from "../resolve-flow";
import { resolveImportablePaths } from "./resolve-importable-paths";
import { namespaceFlowImports } from "./namespace-flow-imports";

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
    dependencies:
      | ResolvedFlydeFlow["dependencies"]
      | ResolvedFlydeFlowDefinition["dependencies"];
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
      } else if (isRefNodeInstance(instance)) {
        const { nodeId } = instance;

        if (nodeId === visualNode.id) {
          continue; // recursive call
        }

        const importPath = inverseImports[nodeId];

        if (!importPath) {
          console.error(
            `${node.id} in ${fullFlowPath} is using referenced node with id ${nodeId} that is not imported`,
            { instance, inverseImports }
          );
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
              const resolvedImport = resolveFlowByPath(importPath, mode);

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
      } else if (isMacroNodeInstance(instance)) {
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
            const { errors, nodes } = resolveCodeNodeDependencies(importPath);

            const targetNode = nodes.find(({ node }) => node.id === macroId);

            if (targetNode) {
              if (!isCodeNode(targetNode.node)) {
                console.warn(
                  `Found node ${macroId} in ${importPath}, but it is not a macro node`
                );
                continue;
              }

              // const macroDef = macroNodeToDefinition(
              //   targetNode.node,
              //   importPath
              // );

              gatheredDependencies[targetNode.node.id] = {
                ...targetNode.node,
                source: {
                  path: importPath,
                  export: targetNode.exportName,
                },
              };

              const resolvedNode = processMacroNodeInstance(
                namespace,
                targetNode.node,
                instance
              );

              gatheredDependencies[resolvedNode.id] = {
                ...resolvedNode,
                sourceCode: (targetNode.node as any).sourceCode,
                source: {
                  path: importPath,
                  export: targetNode.exportName,
                },
              };

              (instance as ResolvedMacroNodeInstance).nodeId = resolvedNode.id;

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
          if (importPath === "@flyde/stdlib" && LocalStdLib[macroId]) {
            let targetCodeNode = LocalStdLib[macroId];

            if (!isCodeNode(targetCodeNode)) {
              throw new Error(
                `Found node ${macroId} in ${importPath}, but it is not a macro node`
              );
            }

            // const macroDef = macroNodeToDefinition(targetCodeNode, importPath);

            // const hardcodedStdLibLocation = require.resolve(
            //   "@flyde/stdlib/dist/all-browser"
            // );

            // if (targetCodeNode.editorConfig.type === "custom") {
            //   const bundleFileName =
            //     targetCodeNode.editorConfig.editorComponentBundlePath
            //       .split("/")
            //       .pop()!;
            //   const bundlePath = join(
            //     hardcodedStdLibLocation,
            //     "../ui",
            //     bundleFileName
            //   );

            //   macroDef.editorConfig = {
            //     type: "custom",
            //     editorComponentBundleContent: readFileSync(bundlePath, "utf-8"),
            //   };
            // }

            /*
              mega hack to read the content's of the bundled node when using built-in stdlib
              TODO - once real-world macro nodes are implemented, this should be rethought of
            */

            console.log("targetCodeNode", targetCodeNode.id);
            gatheredDependencies[targetCodeNode.id] = {
              ...targetCodeNode,
              source: {
                path: importPath,
                export: targetCodeNode.id,
              },
            };
          } else {
            throw new Error(
              `Could not find ${macroId} in ${importPath} or the stdlib`
            );
          }
        }
      } else {
        throw new Error(
          `Unknown node instance type ${JSON.stringify(instance)}`
        );
      }
    }

    console.log("gatheredDependencies", gatheredDependencies);

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
        } else if (isInternalMacroNode(value)) {
          nodes.push({ exportName: key, node: value });
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
