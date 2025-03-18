import {
  VisualNode,
  isCodeNode,
  CodeNode,
  isVisualNodeInstance,
  InternalVisualNode,
  InternalNodeInstance,
  isInlineVisualNodeInstance,
  processMacroNodeInstance,
  CodeNodeSource,
} from "@flyde/core";

import { existsSync, readFileSync } from "fs";
import _ = require("lodash");
import { join } from "path";
import { resolveImportablePaths } from "./resolve-importable-paths";

import * as _StdLib from "@flyde/stdlib/dist/all";
import requireReload from "require-reload";
import { resolveFlowByPath } from "../resolve-flow";

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
Recursively resolve all dependencies of a flow. For each node instance:
1. If it's an inline visual node, recursively resolve it
2. If it's a reference to another node, find and link the actual node definition
*/
export function resolveVisualNode(
  visualNode: VisualNode,
  fullFlowPath: string
): InternalVisualNode {
  const internalInstances = visualNode.instances.map(
    (instance): InternalNodeInstance => {
      if (isInlineVisualNodeInstance(instance)) {
        return {
          ...instance,
          node: resolveVisualNode(instance.source.data, fullFlowPath),
        };
      }

      if (isVisualNodeInstance(instance)) {
        // this can't be inline because we checked above - probably the instance types need minor rethinking
        const source: CodeNodeSource = instance.source as CodeNodeSource;
        const fullPath = join(fullFlowPath, "..", source.data);
        console.log("fullPath", fullPath, source.data);
        const node = resolveFlowByPath(fullPath);

        return {
          ...instance,
          node: node,
        };
      }

      switch (instance.source.type) {
        case "package": {
          return {
            ...instance,
            node: LocalStdLib[instance.source.data] as any,
          };
        }
        case "file": {
          const fullPath = join(fullFlowPath, "..", instance.source.data);
          const resolved = resolveCodeNodeDependencies(fullPath);

          const node = resolved.nodes.find(
            ({ node }) => node.id === instance.nodeId
          );

          if (!node) {
            throw new Error(
              `Cannot find node ${instance.nodeId} in ${fullPath}`
            );
          }

          const processed = processMacroNodeInstance("", node.node, instance);

          return {
            ...instance,
            node: processed,
          };
        }
        default: {
          throw new Error(`Unknown node source type: ${instance.source.type}`);
        }
      }
    }
  );

  return { ...visualNode, instances: internalInstances };

  console.log(internalInstances[0].node);
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
