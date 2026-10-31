import * as path from "path";
import * as yaml from "yaml";

/**
 * A file or folder that VS Code reports as moved or renamed, with absolute paths.
 */
export interface FileMove {
  from: string;
  to: string;
}

type PathApi = typeof path.posix;

export interface RewriteImportPathsOptions {
  /** Absolute path of the flow before the move */
  flowBefore: string;
  /** Absolute path of the flow after the move */
  flowAfter: string;
  moves: FileMove[];
  pathImpl?: PathApi;
  /** Called for every import path that is actually rewritten. */
  onPathRewritten?: (from: string, to: string) => void;
}

const normalizeForComparison = (filePath: string, pathImpl: PathApi) => {
  const normalized = pathImpl.normalize(filePath);
  return pathImpl.sep === "\\" ? normalized.toLowerCase() : normalized;
};

const isSamePath = (a: string, b: string, pathImpl: PathApi) =>
  normalizeForComparison(a, pathImpl) === normalizeForComparison(b, pathImpl);

const isDescendant = (child: string, parent: string, pathImpl: PathApi) => {
  const relativePath = pathImpl.relative(
    pathImpl.normalize(parent),
    pathImpl.normalize(child)
  );
  return (
    relativePath !== ".." &&
    !relativePath.startsWith(`..${pathImpl.sep}`) &&
    !pathImpl.isAbsolute(relativePath)
  );
};

const applyMove = (
  filePath: string,
  move: FileMove,
  pathImpl: PathApi
): string => {
  if (isSamePath(filePath, move.from, pathImpl)) {
    return move.to;
  }

  if (isDescendant(filePath, move.from, pathImpl)) {
    return pathImpl.join(move.to, pathImpl.relative(move.from, filePath));
  }

  return filePath;
};

export function mapPathThroughMoves(
  filePath: string,
  moves: FileMove[],
  pathImpl: PathApi = path
): string {
  return moves.reduce(
    (current, move) => applyMove(current, move, pathImpl),
    filePath
  );
}

export function mapPathThroughMovesBackwards(
  filePath: string,
  moves: FileMove[],
  pathImpl: PathApi = path
): string {
  return [...moves]
    .reverse()
    .reduce(
      (current, move) =>
        applyMove(current, { from: move.to, to: move.from }, pathImpl),
      filePath
    );
}

const resolveNode = (node: unknown, doc: yaml.Document): unknown =>
  yaml.isAlias(node) ? node.resolve(doc) : node;

const nodeAnchor = (node: unknown): string | undefined => {
  if (!node || typeof node !== "object") {
    return undefined;
  }
  const anchor = (node as { anchor?: unknown }).anchor;
  return typeof anchor === "string" ? anchor : undefined;
};

/**
 * Collects anchors on scalar names inside a value. Replacing a sequence can
 * otherwise leave aliases inside that sequence unresolved. Anchors on nested
 * collections are not materialized; callers decline those merges.
 */
const collectAnchoredScalars = (
  node: unknown,
  anchors: Map<string, string>,
  onConflict: () => void,
  isTopLevel: boolean
) => {
  if (yaml.isAlias(node)) {
    return;
  }

  const anchor = nodeAnchor(node);
  if (anchor !== undefined) {
    if (isTopLevel) {
      // Whole-value anchors are copied by the survivor logic.
    } else if (yaml.isScalar(node) && typeof node.value === "string") {
      const existing = anchors.get(node.value);
      if (existing !== undefined && existing !== anchor) {
        onConflict();
      } else {
        anchors.set(node.value, anchor);
      }
    } else {
      onConflict();
    }
  }

  if (yaml.isSeq(node)) {
    for (const item of node.items) {
      collectAnchoredScalars(item, anchors, onConflict, false);
    }
  } else if (yaml.isMap(node)) {
    for (const pair of node.items) {
      collectAnchoredScalars(pair.value, anchors, onConflict, false);
    }
  }
};

/**
 * Updates relative file import paths in a flow so they keep pointing at the same
 * targets after imports, the flow itself, or any parent folder is moved. Covers
 * both the current `source.type: "file"` entries and legacy `imports` keys.
 * Returns the original contents untouched when nothing has to change.
 */
export function rewriteImportPathsAfterMove(
  flowContents: string,
  options: RewriteImportPathsOptions
): string {
  const pathImpl = options.pathImpl ?? path;
  const { flowBefore, flowAfter, moves } = options;

  if (moves.length === 0) {
    return flowContents;
  }

  const doc = yaml.parseDocument(flowContents);
  if (doc.errors.length > 0) {
    return flowContents;
  }

  const beforeDir = pathImpl.dirname(flowBefore);
  const afterDir = pathImpl.dirname(flowAfter);
  const flowMoved = !isSamePath(flowBefore, flowAfter, pathImpl);
  const visitedScalars = new Set<yaml.Scalar>();
  let changed = false;

  const rewritePath = (node: yaml.Scalar): string | undefined => {
    if (visitedScalars.has(node)) {
      return undefined;
    }
    visitedScalars.add(node);

    const data = node.value;
    if (typeof data !== "string") {
      return undefined;
    }

    if (pathImpl.isAbsolute(data)) {
      // Absolute imports do not depend on where the flow lives, but they do
      // break when the imported file itself moves.
      const movedTarget = mapPathThroughMoves(data, moves, pathImpl);
      if (isSamePath(movedTarget, data, pathImpl)) {
        return undefined;
      }
      options.onPathRewritten?.(data, movedTarget);
      return movedTarget;
    }

    const absoluteTarget = pathImpl.resolve(beforeDir, data);
    const movedTarget = mapPathThroughMoves(absoluteTarget, moves, pathImpl);

    if (!flowMoved && isSamePath(movedTarget, absoluteTarget, pathImpl)) {
      return undefined;
    }

    let nextData = pathImpl.relative(afterDir, movedTarget);
    if (pathImpl.sep === "\\" && data.includes("/") && !data.includes("\\")) {
      nextData = nextData.split("\\").join("/");
    }

    if (pathImpl.isAbsolute(nextData) || nextData === data) {
      return undefined;
    }

    options.onPathRewritten?.(data, nextData);
    return nextData;
  };

  const rewriteInstances = (instances: unknown) => {
    const sequence = resolveNode(instances, doc);
    if (!yaml.isSeq(sequence)) {
      return;
    }

    for (const rawInstance of sequence.items) {
      const instance = resolveNode(rawInstance, doc);
      if (!yaml.isMap(instance)) {
        continue;
      }

      const source = resolveNode(instance.get("source"), doc);
      if (!yaml.isMap(source)) {
        continue;
      }

      const sourceType = resolveNode(source.get("type"), doc);
      const sourceTypeValue = yaml.isScalar(sourceType)
        ? sourceType.value
        : sourceType;

      if (sourceTypeValue === "inline") {
        const inlineNode = resolveNode(source.get("data"), doc);
        if (yaml.isMap(inlineNode)) {
          rewriteInstances(inlineNode.get("instances"));
        }
        continue;
      }

      if (sourceTypeValue !== "file") {
        continue;
      }

      const dataNode = resolveNode(source.get("data", true), doc);
      if (!yaml.isScalar(dataNode)) {
        continue;
      }

      const nextData = rewritePath(dataNode);
      if (nextData === undefined) {
        continue;
      }

      dataNode.value = nextData;
      changed = true;
    }
  };

  interface LegacyImportEntry {
    pair: yaml.Pair<unknown, unknown>;
    key: yaml.Scalar;
    originalKey: string;
    nextKey: string | undefined;
    removed: boolean;
    settled: boolean;
  }

  const importNames = (value: unknown): string[] | undefined => {
    const resolved = resolveNode(value, doc);
    if (yaml.isScalar(resolved) && typeof resolved.value === "string") {
      return [resolved.value];
    }
    if (yaml.isSeq(resolved)) {
      const names: string[] = [];
      for (const item of resolved.items) {
        const resolvedItem = resolveNode(item, doc);
        if (
          !yaml.isScalar(resolvedItem) ||
          typeof resolvedItem.value !== "string"
        ) {
          return undefined;
        }
        names.push(resolvedItem.value);
      }
      return names;
    }
    return undefined;
  };

  const rewriteLegacyImports = () => {
    const imports = resolveNode(doc.get("imports"), doc);
    if (!yaml.isMap(imports)) {
      return;
    }

    const entries: LegacyImportEntry[] = [];
    for (const pair of imports.items) {
      const key = pair.key;
      if (!yaml.isScalar(key) || typeof key.value !== "string") {
        continue;
      }

      const originalKey = key.value;
      const isFileImport =
        originalKey.startsWith(".") ||
        pathImpl.isAbsolute(originalKey) ||
        originalKey.endsWith(".flyde") ||
        originalKey.endsWith(".flyde.ts") ||
        originalKey.endsWith(".flyde.js");

      entries.push({
        pair,
        key,
        originalKey,
        nextKey: isFileImport ? rewritePath(key) : undefined,
        removed: false,
        settled: false,
      });
    }

    const occupied = new Map<string, LegacyImportEntry[]>();
    for (const entry of entries) {
      const matches = occupied.get(entry.originalKey) ?? [];
      matches.push(entry);
      occupied.set(entry.originalKey, matches);
    }

    const detach = (entry: LegacyImportEntry) => {
      const matches = occupied.get(entry.originalKey);
      if (!matches) {
        return;
      }
      const index = matches.indexOf(entry);
      if (index !== -1) {
        matches.splice(index, 1);
      }
      if (matches.length === 0) {
        occupied.delete(entry.originalKey);
      }
    };

    const applyGroup = (
      group: LegacyImportEntry[],
      target: string
    ): boolean => {
      const names: string[] = [];
      let hasArrayValue = false;
      const scalarAnchors = new Map<string, string>();
      let anchorConflict = false;
      for (const entry of group) {
        const entryNames = importNames(entry.pair.value);
        if (entryNames === undefined) {
          return false;
        }
        if (yaml.isSeq(resolveNode(entry.pair.value, doc))) {
          hasArrayValue = true;
        }
        if (group.length > 1) {
          collectAnchoredScalars(
            entry.pair.value,
            scalarAnchors,
            () => {
              anchorConflict = true;
            },
            true
          );
        }
        for (const name of entryNames) {
          if (!names.includes(name)) {
            names.push(name);
          }
        }
      }
      if (anchorConflict) {
        return false;
      }

      // Only an anchor written on the entry's own value can be materialized
      // here. `resolveNode` would also expose an anchor that lives on an
      // aliased target elsewhere in the document; copying that name onto the
      // merged value would create a duplicate anchor.
      const anchoredEntries = group.filter(
        (entry) => nodeAnchor(entry.pair.value) !== undefined
      );
      if (anchoredEntries.length > 1) {
        // Merging would leave aliases to the removed anchors unresolved.
        // Leave this group untouched rather than emit invalid YAML.
        return false;
      }

      // Keep the first occurrence. Moving a later anchored entry to the front
      // would place its anchor after aliases that already point at it, and
      // YAML cannot resolve a forward alias. Anchors are materialized at this
      // position instead, see below.
      const survivor = group[0];
      const keyChanged = survivor.originalKey !== target;
      const valueChanged = group.length > 1;
      const anchoredValue = anchoredEntries[0]
        ? resolveNode(anchoredEntries[0].pair.value, doc)
        : undefined;
      const survivorAnchor = anchoredEntries[0]
        ? nodeAnchor(anchoredEntries[0].pair.value)
        : undefined;
      const anchoredScalar =
        yaml.isScalar(anchoredValue) && typeof anchoredValue.value === "string"
          ? anchoredValue.value
          : undefined;

      if (valueChanged) {
        const nextValue =
          hasArrayValue || names.length > 1
            ? doc.createNode(names)
            : doc.createNode(names[0]);
        if (yaml.isSeq(nextValue)) {
          for (const item of nextValue.items) {
            if (yaml.isScalar(item) && typeof item.value === "string") {
              const anchor = scalarAnchors.get(item.value);
              if (anchor !== undefined) {
                item.anchor = anchor;
              }
            }
          }
        } else if (yaml.isScalar(nextValue)) {
          const anchor = scalarAnchors.get(String(nextValue.value));
          if (anchor !== undefined) {
            nextValue.anchor = anchor;
          }
        }

        if (survivorAnchor !== undefined) {
          if (anchoredScalar !== undefined && yaml.isSeq(nextValue)) {
            // A whole-value scalar anchor cannot move onto the merged
            // sequence: aliases would start resolving to an array. Keep it on
            // the scalar item so the alias keeps its original type.
            const anchoredItem = nextValue.items.find(
              (item) =>
                yaml.isScalar(item) && item.value === anchoredScalar
            );
            if (yaml.isScalar(anchoredItem)) {
              if (
                anchoredItem.anchor !== undefined &&
                anchoredItem.anchor !== survivorAnchor
              ) {
                return false;
              }
              anchoredItem.anchor = survivorAnchor;
            }
          } else {
            nextValue.anchor = survivorAnchor;
          }
        }
        survivor.pair.value = nextValue;
      }
      if (keyChanged) {
        survivor.key.value = target;
      }

      for (const entry of group) {
        detach(entry);
        entry.settled = true;
        if (entry !== survivor) {
          entry.removed = true;
        }
      }

      const targetMatches = occupied.get(target) ?? [];
      targetMatches.push(survivor);
      occupied.set(target, targetMatches);

      if (keyChanged || valueChanged) {
        changed = true;
      }

      return true;
    };

    let foundRewrite = true;
    while (foundRewrite) {
      foundRewrite = false;

      const groups = new Map<string, LegacyImportEntry[]>();
      for (const entry of entries) {
        if (entry.removed || entry.settled || entry.nextKey === undefined) {
          continue;
        }
        const group = groups.get(entry.nextKey) ?? [];
        group.push(entry);
        groups.set(entry.nextKey, group);
      }

      for (const [target, group] of groups) {
        if (group.length === 1 && group[0].originalKey === target) {
          group[0].settled = true;
          continue;
        }

        const blockedBy = (occupied.get(target) ?? []).filter(
          (entry) => !entry.removed && !group.includes(entry)
        );
        if (blockedBy.length > 0) {
          continue;
        }

        if (!applyGroup(group, target)) {
          // Values that cannot be merged safely must stay untouched rather
          // than produce duplicate YAML keys.
          group.forEach((entry) => {
            entry.settled = true;
          });
          continue;
        }

        foundRewrite = true;
      }
    }

    if (entries.some((entry) => entry.removed)) {
      imports.items = imports.items.filter(
        (pair) => !entries.some((entry) => entry.removed && entry.pair === pair)
      );
    }
  };

  rewriteInstances(doc.getIn(["node", "instances"]));
  rewriteLegacyImports();

  if (!changed) {
    return flowContents;
  }

  let output = doc.toString();
  if (flowContents.includes("\r\n")) {
    output = output.replace(/\r?\n/g, "\r\n");
  }
  if (!/\r?\n$/.test(flowContents)) {
    output = output.replace(/\r?\n$/, "");
  }

  return output;
}
