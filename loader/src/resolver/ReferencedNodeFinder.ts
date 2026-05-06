import { FlydeNode, CodeNode } from "@flyde/core";

import { NodeInstance } from "@flyde/core/dist/node";

export type ReferencedNodeFinder = (
  instance: NodeInstance,
) => FlydeNode | (CodeNode & { sourceCode: string });

export type NestedReferencedNodeFinder = ReferencedNodeFinder & {
  forVisualNode?: (node: FlydeNode) => ReferencedNodeFinder;
};
