import { z } from "zod";
import { VisualNode, NodeDefinition } from "./node";
import { CodeNode } from "./improved-macros/improved-macros";

const importSchema = z.record(z.string(), z.string().or(z.array(z.string())));
const position = z.strictObject({ x: z.number(), y: z.number() });

const inputConfig = z.discriminatedUnion("mode", [
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

const instance = z.object({
  pos: position.default({ x: 0, y: 0 }),
  id: z.string(),
  inputConfig: z.optional(z.record(z.string(), inputConfig)).default({}),
  visibleInputs: z.optional(z.array(z.string())),
  visibleOutputs: z.optional(z.array(z.string())),
  nodeId: z.optional(z.string()),
  // @deprecated
  macroId: z.optional(z.string()),
  // @deprecated
  macroData: z.optional(z.any()),
  config: z.optional(z.any()),
  type: z.optional(z.enum(["CodeNode", "VisualNode", "code"])),
  source: z.optional(
    z.object({
      type: z.string(),
      data: z.any(),
    })
  ),
  style: z.optional(nodeStyle),
});

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
  completionOutputs: z.optional(z.array(z.string())),
  reactiveInputs: z.optional(z.array(z.string())),
  defaultStyle: z.optional(nodeStyle),
  description: z.optional(z.string()),
  aliases: z.optional(z.array(z.string())),
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
  /** @deprecated */
  imports?: Record<string, string[]>;
  node: VisualNode;
};

export type ImportedNodeDefinition = NodeDefinition;

export type ImportedNode = VisualNode | CodeNode;

export type ImportedNodeDef = NodeDefinition;

export const flydeFlowSchema = z.strictObject({
  /** @deprecated */
  imports: z.optional(importSchema).default({}),
  node: visualNode,
});
