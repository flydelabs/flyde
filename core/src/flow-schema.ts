import { z } from "zod";
import { VisualNode, NodeDefinition, Node, ResolvedVisualNode } from "./node";

const importSchema = z.record(z.string(), z.string().or(z.array(z.string())));
const position = z.strictObject({ x: z.number(), y: z.number() });

const inputConfig = z.discriminatedUnion("mode", [
  z.strictObject({
    mode: z.literal("static"),
    value: z.any(),
  }),
  z.strictObject({
    mode: z.literal("queue"),
  }),
  z.strictObject({
    mode: z.literal("sticky"),
  }),
]);

const nodeStyle = z.object({
  size: z.optional(z.enum(["small", "regular", "large"])),
  icon: z.optional(z.any()),
  color: z.optional(z.string()),
  cssOverride: z.optional(z.record(z.string())),
});

const instance = z
  .object({
    pos: position.default({ x: 0, y: 0 }),
    id: z.string(),
    inputConfig: z.optional(z.record(z.string(), inputConfig)).default({}),
    visibleInputs: z.optional(z.array(z.string())),
    visibleOutputs: z.optional(z.array(z.string())),
    nodeId: z.optional(z.string()),
    node: z.optional(z.any()),
    macroId: z.optional(z.string()),
    macroData: z.optional(z.any()),
    style: z.optional(nodeStyle),
  })
  .refine(
    (val) =>
      val.node ||
      val.nodeId ||
      (val.macroId && typeof val.macroData !== "undefined"),
    {
      message:
        "Instance must have either an inline node or refer to a nodeId, or be a macro instance",
    }
  );

const inputPinSchema = z.union([
  z.string(),
  z.object({
    mode: z.enum(["required", "optional", "required-if-connected"]),
    /** @deprecated */
    type: z.optional(z.string()),
    description: z.optional(z.string()),
    defaultValue: z.optional(z.any()),
  }),
]);

const outputPinSchema = z.object({
  /** @deprecated */
  type: z.optional(z.string()),
  optional: z.optional(z.boolean()),
  delayed: z.optional(z.boolean()),
  description: z.optional(z.string()),
});

const flydeBaseNode = z.object({
  id: z.optional(z.string()),
  inputs: z.record(z.string(), inputPinSchema),
  outputs: z.record(z.string(), outputPinSchema),
  inputsPosition: z.optional(z.record(z.string(), position)),
  outputsPosition: z.optional(z.record(z.string(), position)),
  customViewCode: z.optional(z.string()),
  dataBuilderSource: z.optional(z.string()),
  templateType: z.optional(z.string()),
  completionOutputs: z.optional(z.array(z.string())),
  reactiveInputs: z.optional(z.array(z.string())),
  defaultStyle: z.optional(nodeStyle),
  description: z.optional(z.string()),
  searchKeywords: z.optional(z.array(z.string())),
});

const visualNode = z
  .object({
    instances: z.array(instance),
    connections: z.array(
      z.strictObject({
        from: z.strictObject({ insId: z.string(), pinId: z.string() }),
        to: z.strictObject({ insId: z.string(), pinId: z.string() }),
        delayed: z.optional(z.boolean()),
        hidden: z.optional(z.boolean()),
      })
    ),
  })
  .and(flydeBaseNode);

export type FlydeFlow = {
  imports?: Record<string, String[]>;
  node: VisualNode;
};

export interface ImportSource {
  path: string;
  export?: string;
}

export type ImportedNodeDefinition = NodeDefinition & {
  source: ImportSource;
};

export type ImportedNode = Node & {
  source: ImportSource;
};

export type ImportedNodeDef = NodeDefinition & {
  source: ImportSource;
};

export type ResolvedDependenciesDefinitions = Record<
  string,
  ImportedNodeDefinition
>;

export type ResolvedFlydeFlowDefinition = {
  main: ResolvedVisualNode;
  dependencies: ResolvedDependenciesDefinitions;
};

export type ResolvedDependencies = Record<string, ImportedNode>;

export type ResolvedFlydeRuntimeFlow = {
  main: ResolvedVisualNode;
  dependencies: ResolvedDependencies;
};

export type ResolvedFlydeFlow =
  | ResolvedFlydeFlowDefinition
  | ResolvedFlydeRuntimeFlow;

export const flydeFlowSchema = z.strictObject({
  imports: z.optional(importSchema).default({}),
  node: visualNode,
});
