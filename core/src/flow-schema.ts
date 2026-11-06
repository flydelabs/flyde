// core/src/flow-schema.ts
import { z } from "zod";
import { VisualNode, NodeDefinition } from "./node";
import { CodeNode } from "./configurable-nodes/configurable-nodes";
import * as path from "path";

/* -------------------------------------------------------------------------- */
/*                               ZOD SCHEMAS                                */
/* -------------------------------------------------------------------------- */

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
  displayName: z.optional(z.string()),
  nodeId: z.optional(z.string()),
  // @deprecated
  macroId: z.optional(z.string()),
  // @deprecated
  macroData: z.optional(z.any()),
  config: z.optional(z.any()),

  // @deprecated - use source instead
  node: z.optional(z.any()),

  type: z.optional(z.enum(["code", "visual"])),
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

/* -------------------------------------------------------------------------- */
/*                               TYPE EXPORTS                                 */
/* -------------------------------------------------------------------------- */

export type FlydeFlow = {
  /** @deprecated */
  imports?: Record<string, string[]>;
  node: VisualNode;
};

export type ImportedNodeDefinition = NodeDefinition;
export type ImportedNode = VisualNode | CodeNode;
export type ImportedNodeDef = NodeDefinition;

/* -------------------------------------------------------------------------- */
/*                                 SCHEMA                                     */
/* -------------------------------------------------------------------------- */

export const flydeFlowSchema = z.strictObject({
  /** @deprecated */
  imports: z.optional(importSchema).default({}),
  node: visualNode,
});

/* -------------------------------------------------------------------------- */
/*                     IMPORT PATH NORMALISATION HELPERS                    */
/* -------------------------------------------------------------------------- */

/**
 * Resolve a single import path relative to a given base directory.
 *
 * - If the path is absolute it is returned unchanged (but normalised).
 * - If the path is relative (`./` or `../`) it is resolved against `baseDir`.
 * - Empty or whitespace‑only strings cause an explicit error – they would
 *   otherwise resolve to the `baseDir`, which is almost never what the caller
 *   intends.
 * - The function also normalises Windows/Unix separators.
 *
 * @param importPath The path string stored in the flow file.
 * @param baseDir    The directory of the flow file that contains the import.
 *
 * @returns Normalised absolute path.
 *
 * @throws {Error} If `importPath` is empty or `baseDir` is not an absolute path.
 */
export function resolveImportPath(importPath: string, baseDir: string): string {
  if (!importPath || /^\s*$/.test(importPath)) {
    throw new Error("resolveImportPath: importPath must be a non‑empty string");
  }

  // `baseDir` is expected to be absolute because it originates from
  // `path.dirname(flowFilePath)`. Guard against programmer error.
  if (!path.isAbsolute(baseDir)) {
    throw new Error(
      `resolveImportPath: baseDir must be absolute – received "${baseDir}"`
    );
  }

  // Normalise first to avoid mixed separators (e.g. Windows backslashes)
  const normalized = path.normalize(importPath);

  // If the import is already absolute we simply return the normalised version.
  if (path.isAbsolute(normalized)) {
    return normalized;
  }

  // Relative import – resolve against the flow file location.
  return path.resolve(baseDir, normalized);
}

/**
 * Normalise the whole `imports` map.
 *
 * The original schema stores imports as `Record<string, string | string[]>`.
 * For the runtime we convert every entry to an **array of absolute, normalised
 * paths**. Duplicate entries are collapsed to a single occurrence while
 * preserving order.
 *
 * @param imports Raw import map from the parsed flow file.
 * @param flowDir Directory where the flow file lives (must be absolute).
 *
 * @returns A map where each key points to an array of absolute, normalised paths.
 *
 * @throws {Error} If `flowDir` is not absolute.
 */
export function normaliseImports(
  imports: Record<string, string | string[]>,
  flowDir: string
): Record<string, string[]> {
  if (!path.isAbsolute(flowDir)) {
    throw new Error(
      `normaliseImports: flowDir must be absolute – received "${flowDir}"`
    );
  }

  const result: Record<string, string[]> = {};

  for (const [key, rawValue] of Object.entries(imports)) {
    // Ensure we always work with an array.
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];

    // Resolve each entry, deduplicate while preserving order.
    const resolvedSet = new Set<string>();
    for (const v of values) {
      const resolved = resolveImportPath(v, flowDir);
      if (!resolvedSet.has(resolved)) {
        resolvedSet.add(resolved);
      }
    }

    result[key] = Array.from(resolvedSet);
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/*                                 UNIT TESTS                                 */
/* -------------------------------------------------------------------------- */

/**
 * NOTE: The following tests are written using Jest. They are placed at the
 * bottom of the source file to keep the implementation self‑contained for the
 * purpose of the challenge. In a real code‑base they would live under
 * `__tests__/flow-schema.test.ts`.
 *
 * The block only executes when the environment variable `NODE_ENV` is set to
 * `"test"` – this prevents the test code from being bundled in production
 * builds.
 */

if (process.env.NODE_ENV === "test") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { describe, it, expect } = require("@jest/globals");

  describe("resolveImportPath", () => {
    const base = "/project/flows";

    it("keeps absolute paths untouched (but normalised)", () => {
      const abs = "/project/shared/utils.ts";
      expect(resolveImportPath(abs, base)).toBe(path.normalize(abs));
    });

    it("resolves relative paths correctly", () => {
      const rel = "./subdir/../module.ts";
      const expected = path.resolve(base, "module.ts");
      expect(resolveImportPath(rel, base)).toBe(expected);
    });

    it("throws on empty import paths", () => {
      expect(() => resolveImportPath("", base)).toThrow(
        "resolveImportPath: importPath must be a non‑empty string"
      );
    });

    it("throws when baseDir is not absolute", () => {
      const rel = "./a.ts";
      expect(() => resolveImportPath(rel, "relative/base")).toThrow(
        /baseDir must be absolute/
      );
    });
  });

  describe("normaliseImports", () => {
    const flowDir = "/project/flows/main";

    it("converts single string values to arrays", () => {
      const raw = { myNode: "./node.ts" };
      const norm = normaliseImports(raw, flowDir);
      expect(Array.isArray(norm.myNode)).toBe(true);
      expect(norm.myNode[0]).toBe(path.resolve(flowDir, "./node.ts"));
    });

    it("normalises multiple imports and removes duplicates", () => {
      const raw = {
        nodeA: ["./a.ts", "../shared/b.ts", "./a.ts"], // duplicate "./a.ts"
        nodeB: "./b.ts",
      };
      const norm = normaliseImports(raw, flowDir);
      expect(norm.nodeA).toEqual([
        path.resolve(flowDir, "./a.ts"),
        path.resolve(flowDir, "../shared/b.ts"),
      ]);
      expect(norm.nodeB).toEqual([path.resolve(flowDir, "./b.ts")]);
    });

    it("throws when flowDir is not absolute", () => {
      const raw = { node: "./x.ts" };
      expect(() => normaliseImports(raw, "relative/dir")).toThrow(
        /flowDir must be absolute/
      );
    });
  });
}