import { OMap, OMapF } from "../common";
import { Subject } from "rxjs";

import { CancelFn, InnerExecuteFn } from "../execute";

import { MacroNodeDefinition } from "./macro-node";
import { CodeNode } from "..";
import { CodeNodeDefinition, VisualNode } from "@flyde/core";
import { InternalNode } from "../types/internal";

/** @deprecated use InternalNodesCollection instead */
export type NodesCollection = OMap<InternalNode | CodeNode>;

export type InternalNodesCollection = OMap<InternalNode>;

export type NodesDefCollection = OMap<NodeDefinition>;

export type CustomNodeCollection = OMap<VisualNode>;

export type NodeState = Map<string, any>;

export type NodeAdvancedContext = {
  execute: InnerExecuteFn;
  insId: string;
  ancestorsInsIds?: string;
  state: NodeState;
  globalState: NodeState;
  onCleanup: (cb: Function) => void;
  onError: (e: any) => void;
  context: Record<string, any>;
};

export type RunNodeFunction = (
  args: OMapF<any>,
  o: OMapF<Subject<any>>,
  adv: NodeAdvancedContext
) => void | CancelFn | Promise<void | CancelFn>;

export * from "./macro-node";

export type NodeDefinition = VisualNode | CodeNodeDefinition;
export type NodeOrMacroDefinition = NodeDefinition | MacroNodeDefinition<any>;

export * from "./node-instance";
export * from "../types/internal";
export * from "../types/core";
export * from "../types/external";
export * from "../types/pins";
