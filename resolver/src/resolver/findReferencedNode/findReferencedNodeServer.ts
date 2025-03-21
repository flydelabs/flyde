import {
  CodeNode,
  FlydeNode,
  isCodeNode,
  NodeInstance,
  AdvancedCodeNode
} from "@flyde/core";

import * as _StdLib from "@flyde/stdlib/dist/all";
import { join, dirname } from "path";
import {
  resolveCodeNodeDependencies,
} from "../resolveVisualNode";
import { existsSync, readFileSync } from "fs";
import { resolveImportablePaths } from "../resolveImportablePaths";
import { deserializeFlowByPath } from "../../serdes";
import { ReferencedNodeFinder } from "./ReferencedNodeFinder";

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

export function createServerReferencedNodeFinder(fullFlowPath: string): ReferencedNodeFinder {
  return (
    instance: NodeInstance,
  ): FlydeNode => {
    switch (instance.source.type) {
      case "package": {
        const paths = getLocalOrPackagePaths(fullFlowPath, instance.source.data);

        const nodeWrapper = paths
          .flatMap<FlydeNode>((path) => {
            const isVisual = path.endsWith(".flyde");

            if (isVisual) {
              try {
                const node = deserializeFlowByPath(path).node;
                // No longer adding sourcePath
                return [node as FlydeNode];
              } catch (e) {
                return [];
              }
            }
            const { nodes } = resolveCodeNodeDependencies(path);

            return nodes.map((n) => n.node);
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

            // The bundle content is already included during the post-processing step
            return maybeFromStdlib as FlydeNode;
          }

          throw new Error(
            `Cannot find node ${instance.source.data} in ${fullFlowPath}`
          );
        }

        const maybeAdvancedNode = nodeWrapper as AdvancedCodeNode<any>;
        // read the editorComponentBundlePath if it exists
        if (maybeAdvancedNode.editorConfig &&
          'editorComponentBundlePath' in maybeAdvancedNode.editorConfig &&
          'type' in maybeAdvancedNode.editorConfig &&
          maybeAdvancedNode.editorConfig.type === 'custom') {
          try {
            const editorComponentBundlePath = join(fullFlowPath, "..", maybeAdvancedNode.editorConfig.editorComponentBundlePath);
            maybeAdvancedNode.editorConfig.editorComponentBundleContent = readFileSync(editorComponentBundlePath, 'utf-8');
          } catch (e) {
            throw new Error(`Cannot read editor component bundle at ${maybeAdvancedNode.editorConfig.editorComponentBundlePath}`);
          }
        }

        return nodeWrapper;
      }
      case "file": {
        const fullFilePath = join(fullFlowPath, "..", instance.source.data);

        // Update editorComponentBundlePath if it exists
        const resolved = resolveCodeNodeDependencies(fullFilePath);

        const node = resolved.nodes.find(
          ({ node }) => node.id === instance.nodeId
        );

        if (!node) {
          throw new Error(`Cannot find node ${instance.nodeId} in ${fullFilePath}`);
        }


        const maybeAdvancedNode = node.node as AdvancedCodeNode<any>;
        // read the editorComponentBundlePath if it exists
        if (maybeAdvancedNode.editorConfig &&
          'editorComponentBundlePath' in maybeAdvancedNode.editorConfig &&
          'type' in maybeAdvancedNode.editorConfig &&
          maybeAdvancedNode.editorConfig.type === 'custom') {
          const fullPath = join(fullFlowPath, "..", maybeAdvancedNode.editorConfig.editorComponentBundlePath);
          maybeAdvancedNode.editorConfig.editorComponentBundleContent = readFileSync(fullPath, 'utf-8');
        }

        return node.node;
      }
      case "inline": {
        return instance.source.data;
      }
      default: {
        throw new Error(`Unknown node source type: ${instance.source.type}`);
      }
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
