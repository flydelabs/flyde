import { OMapF } from "../common";
import { Subject } from "rxjs";

import { CancelFn, InnerExecuteFn } from "../execute";

import { ConfigurableNodeDefinition } from "./configurable-value";
import { VisualNode } from "../types/external";
import { CodeNodeDefinition } from "../types/external";

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

export * from "./configurable-value";

export type NodeDefinition = VisualNode | CodeNodeDefinition;
export type NodeOrConfigurableDefinition = NodeDefinition | ConfigurableNodeDefinition<any>;

export * from "./node-instance";
export * from "../types/internal";
export * from "../types/core";
export * from "../types/external";
export * from "../types/pins";
