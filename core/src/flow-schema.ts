import { z } from "zod";
import { CustomPart, Part, PartDefinition } from "./part";


const importDef = z.strictObject({ name: z.string(), alias: z.string() });
const importedIdOrDef = z.union([
  z.string(),
  importDef,
]);
const importSchema = z.record(z.string(), z.array(importedIdOrDef));
const position = z.strictObject({ x: z.number(), y: z.number() });

const inlineCode = z.object({
  fnCode: z.string(),
  templateType: z.optional(z.string())
});

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

const groupedPart = z.object({
  instances: z.array(
    z.strictObject({
      partId: z.string(),
      pos: position.default({x: 0, y: 0}),
      id: z.string(),
      inputConfig: z.optional(z.record(z.string(), inputConfig)).default({}),
      visibleInputs: z.optional(z.array(z.string()))
    })
  ),
  connections: z.array(
    z.strictObject({
      from: z.strictObject({ insId: z.string(), pinId: z.string() }),
      to: z.strictObject({ insId: z.string(), pinId: z.string() }),
    })
  ),
});

const flydeBasePart = z.object({
  id: z.optional(z.string()),
  inputs: z.record(
    z.string(),
    z.union([
      z.string(),
      z.object({
        mode: z.enum(["required", "optional", "required-if-connected"]),
        type: z.string(),
      }),
    ])
  ),
  outputs: z.record(z.string(), z.union([z.string(), z.object({ type: z.string() })])),
  inputsPosition: z.optional(z.record(z.string(), position)),
  outputsPosition: z.optional(z.record(z.string(), position)),
  customViewCode: z.optional(z.string()),
  dataBuilderSource: z.optional(z.string()),
  templateType: z.optional(z.string()),
  completionOutputs: z.optional(z.array(z.string())),
  reactiveInputs: z.optional(z.array(z.string()))
});

const flydePart = flydeBasePart
  .and(z.union([inlineCode, groupedPart]));
  
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

// export type FlydeFlow = WithRequired<PartialFlydeFlow, "parts">;

export interface ExposedFunctionality {
  codeName: string;
  displayName: string;
  inputs: string[];
  path: string;
  line: string;
}


export type FlydeFlowImportDef = z.infer<typeof importDef>;
export type FlydeFlowImportDefOrId = z.infer<typeof importedIdOrDef>;

export type FlydeFlow = {
  imports: Record<string, FlydeFlowImportDef[]>;
  exports: string[];
  parts: Record<string, CustomPart>;
  mainId?: string;
  exposedFunctionality?: ExposedFunctionality[];
}

export type ResolvedFlydeFlowDefinition = Record<string, CustomPart & { imported?: boolean;}>
export type ResolvedFlydeRuntimeFlow = Record<string, Part>;

export type ResolvedFlydeFlow = ResolvedFlydeFlowDefinition | ResolvedFlydeRuntimeFlow;

export const flydeFlowSchema = z
  .strictObject({
    imports: z.optional(importSchema).default({}),
    exports: z.optional(z.array(z.string())).default([]),
    mainId: z.optional(z.string()),
    main: z.optional(z.any()), // deprecated
    parts: z.record(z.string(), flydePart).default({}),
    exposedFunctionality: z.optional(z.array(z.strictObject({
      codeName: z.string(),
      displayName: z.string(),
      inputs: z.optional(z.array(z.string())),
      path: z.string(),
      line: z.string()
    }))).default([])
  });

