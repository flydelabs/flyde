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

import { readFileSync } from "fs";
import _ = require("lodash");
import { join } from "path";

import * as _StdLib from "@flyde/stdlib/dist/all";
import requireReload from "require-reload";
import { resolveFlowByPath } from "./resolve-flow";
import { findReferencedCodeNode } from "./find-referenced-node";

/*
Recursively resolve all dependencies of a flow. For each node instance:
1. If it's an inline visual node, recursively resolve it
2. If it's a reference to another node, find and link the actual node definition
*/
export function resolveVisualNode(
  visualNode: VisualNode,
  fullFlowPath: string
): InternalVisualNode {
  console.log("resolving", visualNode.id);
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

        const node = resolveFlowByPath(fullPath);

        return {
          ...instance,
          node: node,
        };
      }

      const node = findReferencedCodeNode(instance, fullFlowPath);
      const processed = processMacroNodeInstance("", node, instance);

      return {
        ...instance,
        node: processed,
      };
    }
  );

  return { ...visualNode, instances: internalInstances };
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
