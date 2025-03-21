import {
  CodeNode,
  CodeNodeSource,
  InternalVisualNode,
  isCodeNode,
  isVisualNode,
  isVisualNodeInstance,
  processMacroNodeInstance,
  VisualNode,
  isInlineVisualNodeInstance,
} from "@flyde/core";
import { join } from "path";
import { resolveFlowByPath } from "./resolveFlow";
import { existsSync } from "fs";
import { createServerReferencedNodeFinder } from "./findReferencedNode/findReferencedNodeServer";

/*
Recursively resolve all dependencies of a flow. For each node instance:
1. If it's an inline visual node, recursively resolve it
2. If it's a reference to another node, find and link the actual node definition
*/
export function resolveVisualNode(
  visualNode: VisualNode,
  fullFlowPath: string
): InternalVisualNode {

  const findReferencedNode = createServerReferencedNodeFinder(fullFlowPath);
  const internalInstances = visualNode.instances.map((instance) => {
    if (isInlineVisualNodeInstance(instance)) {
      const resolved = resolveVisualNode(instance.source.data, fullFlowPath);
      // TODO: weird gap in types? This seems to be similar to createInternalInlineNodeInstance - need to double check
      return {
        id: instance.id,
        node: resolved,
        inputConfig: instance.inputConfig,
      };
    }

    if (isVisualNodeInstance(instance)) {
      if (instance.source.type === "self") {
        return {
          ...instance,
          node: "__SELF" as any,
        };
      }

      // this can't be inline because we checked above - probably the instance types need minor rethinking
      const source: CodeNodeSource = instance.source as CodeNodeSource;
      const fullPath = join(fullFlowPath, "..", source.data);

      const node = resolveFlowByPath(fullPath);

      return {
        ...instance,
        node: node,
      };
    }

    const node = findReferencedNode(instance);

    if (isVisualNode(node)) {
      const resolved = resolveVisualNode(node, fullFlowPath);
      return {
        ...instance,
        node: resolved,
      };
    }

    const processed = processMacroNodeInstance("", node, instance);

    return {
      ...instance,
      node: processed,
    };
  });

  const newNode: InternalVisualNode = {
    ...visualNode,
    instances: internalInstances,
  };

  for (const ins of newNode.instances) {
    if ((ins.node as any) === "__SELF") {
      ins.node = newNode;
    }
  }

  return newNode;
}

export function findTypeScriptSource(jsPath: string): string | null {
  if (!jsPath.includes("/dist/") || !jsPath.endsWith(".js")) {
    return null;
  }

  const potentialTsPath = jsPath
    .replace("/dist/", "/src/")
    .replace(".js", ".ts");

  if (existsSync(potentialTsPath)) {
    return potentialTsPath;
  }
  return null;
}

export function resolveCodeNodeDependencies(path: string): {
  errors: string[];
  nodes: {
    exportName: string;
    node: CodeNode<any>;
  }[];
} {
  if (!path.endsWith(".js") && !path.endsWith(".ts")) {
    throw new Error(`Path ${path} is not a JS or TS file`);
  }

  try {
    // This is a hack to require the file
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    let result = require(path);
    if (result.__esModule) {
      result = result.default || result;
    }

    if (isCodeNode(result)) {
      return {
        errors: [],
        nodes: [{ exportName: result.id, node: result }],
      };
    } else if (result) {
      if (typeof result === "object") {
        const entries = Object.entries(result);
        const nodes = entries
          .filter(([, value]) => isCodeNode(value))
          .map(([key, value]) => ({ exportName: key, node: value as any }));
        const errors: string[] = [];
        return { errors, nodes };
      }
    }
    return {
      errors: [`No code nodes found in ${path}`],
      nodes: [],
    };
  } catch (e) {
    console.error(`Error resolving code node from ${path}`, e);
    return {
      errors: [`Error resolving code node from ${path}: ${e}`],
      nodes: [],
    };
  }
}

export function isCodeNodePath(path: string): boolean {
  return path.endsWith(".js") || path.endsWith(".ts");
}
