import {
  CodeNode,
  FlydeNode,
  isCodeNode,
  isInlineVisualNodeInstance,
  NodeInstance,
  processMacroNodeInstance,
} from "@flyde/core";

import * as _StdLib from "@flyde/stdlib/dist/all";
import { join } from "path";
import { resolveCodeNodeDependencies } from "./resolve-visual-node";
import { existsSync } from "fs";
import { resolveImportablePaths } from "./resolve-importable-paths";

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

export function findReferencedCodeNode(
  instance: NodeInstance,
  fullFlowPath: string
): CodeNode {
  switch (instance.source.type) {
    case "package": {
      // const node = LocalStdLib[instance.source.data];

      const paths = getLocalOrPackagePaths(fullFlowPath, instance.source.data);

      const nodeWrapper = paths
        .flatMap((path) => {
          return resolveCodeNodeDependencies(path).nodes;
        })
        .find(({ node }) => node.id === instance.nodeId);

      if (!nodeWrapper) {
        if (instance.source.data === "@flyde/stdlib") {
          const maybeFromStdlib = LocalStdLib[instance.nodeId];

          if (!maybeFromStdlib) {
            throw new Error(
              `Cannot find node ${instance.nodeId} in ${fullFlowPath}, even not in the internal copy of "@flyde/stdlib"`
            );
          }

          return maybeFromStdlib;
        }

        throw new Error(
          `Cannot find node ${instance.source.data} in ${fullFlowPath}`
        );
      }

      return nodeWrapper.node;
    }
    case "file": {
      const fullPath = join(fullFlowPath, "..", instance.source.data);
      const resolved = resolveCodeNodeDependencies(fullPath);

      const node = resolved.nodes.find(
        ({ node }) => node.id === instance.nodeId
      );

      if (!node) {
        throw new Error(`Cannot find node ${instance.nodeId} in ${fullPath}`);
      }

      return node.node;
    }
    default: {
      console.log(instance, isInlineVisualNodeInstance);
      throw new Error(`Unknown node source type: ${instance.source.type}`);
    }
  }
}

function getLocalOrPackagePaths(fullFlowPath: string, importPath: string) {
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
}
