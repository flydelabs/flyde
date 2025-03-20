import {
  CodeNode,
  FlydeNode,
  isCodeNode,
  NodeInstance,
} from "@flyde/core";

import * as _StdLib from "@flyde/stdlib/dist/all";
import { join } from "path";
import {
  resolveCodeNodeDependencies,
} from "./resolve-visual-node";
import { existsSync } from "fs";
import { resolveImportablePaths } from "./resolve-importable-paths";
import { deserializeFlowByPath } from "../serdes";

// Create a type that extends the FlydeNode with a sourcePath
export type NodeWithSourcePath = FlydeNode & {
  sourcePath: string;
};

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

export function findReferencedNode(
  instance: NodeInstance,
  fullFlowPath: string
): NodeWithSourcePath {
  console.log("finding referenced node", instance);
  switch (instance.source.type) {
    case "package": {
      // const node = LocalStdLib[instance.source.data];

      const paths = getLocalOrPackagePaths(fullFlowPath, instance.source.data);

      const nodeWrapper = paths
        .flatMap<NodeWithSourcePath>((path) => {
          const isVisual = path.endsWith(".flyde");

          if (isVisual) {
            try {
              const node = deserializeFlowByPath(path).node;
              // Add sourcePath to track where this node comes from
              const nodeWithPath = node as NodeWithSourcePath;
              nodeWithPath.sourcePath = path;
              return [nodeWithPath];
            } catch (e) {
              console.log("error", e);
              return [];
            }
          }
          const { errors, nodes } = resolveCodeNodeDependencies(path);
          console.log("errors", errors);
          return nodes.map((n) => {
            const node = n.node as CodeNode;
            // Add sourcePath to track where this node comes from
            const nodeWithPath = node as NodeWithSourcePath;
            nodeWithPath.sourcePath = path;
            return nodeWithPath;
          });
        })
        .find((node) => node.id === instance.nodeId);

      if (!nodeWrapper) {
        if (instance.source.data === "@flyde/stdlib") {
          const maybeFromStdlib = LocalStdLib[instance.nodeId];

          if (!maybeFromStdlib) {
            throw new Error(
              `Cannot find node ${instance.nodeId} in ${fullFlowPath}, even not in the internal copy of "@flyde/stdlib"`
            );
          }

          // Add sourcePath for stdlib nodes
          const nodeWithPath = maybeFromStdlib as NodeWithSourcePath;
          nodeWithPath.sourcePath = "@flyde/stdlib";
          return nodeWithPath;
        }

        console.log();

        throw new Error(
          `Cannot find node ${instance.source.data} in ${fullFlowPath}`
        );
      }

      return nodeWrapper;
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

      // Add sourcePath to track where this node comes from
      const nodeWithPath = node.node as NodeWithSourcePath;
      nodeWithPath.sourcePath = fullPath;
      return nodeWithPath;
    }
    case "inline": {
      const inlineNode = instance.source.data;
      // Add sourcePath for inline nodes - use the parent flow path
      const nodeWithPath = inlineNode as NodeWithSourcePath;
      nodeWithPath.sourcePath = fullFlowPath;
      return nodeWithPath;
    }
    default: {
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
