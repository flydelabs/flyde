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
      return isSamePath(movedTarget, data, pathImpl) ? undefined : movedTarget;
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

  const rewriteLegacyImports = () => {
    const imports = resolveNode(doc.get("imports"), doc);
    if (!yaml.isMap(imports)) {
      return;
    }

    const entries = imports.items
      .map((pair) => {
        const key = pair.key;
        if (!yaml.isScalar(key) || typeof key.value !== "string") {
          return undefined;
        }
        return { key, value: key.value };
      })
      .filter(
        (entry): entry is { key: yaml.Scalar; value: string } =>
          entry !== undefined
      );

    const planned = entries.map(({ key, value }) => {
      const isFileImport =
        value.startsWith(".") ||
        pathImpl.isAbsolute(value) ||
        value.endsWith(".flyde") ||
        value.endsWith(".flyde.ts") ||
        value.endsWith(".flyde.js");

      return {
        key,
        value,
        nextKey: isFileImport ? rewritePath(key) : undefined,
      };
    });

    const applied = new Set<(typeof planned)[number]>();
    let foundRewrite = true;

    while (foundRewrite) {
      foundRewrite = false;

      const retainedKeys = new Set(
        planned
          .filter((entry) => !applied.has(entry))
          .map((entry) => entry.value)
      );
      const pendingTargets = new Map<string, number>();
      for (const entry of planned) {
        if (!applied.has(entry) && entry.nextKey !== undefined) {
          pendingTargets.set(
            entry.nextKey,
            (pendingTargets.get(entry.nextKey) ?? 0) + 1
          );
        }
      }

      for (const entry of planned) {
        const { nextKey, value } = entry;
        if (
          applied.has(entry) ||
          nextKey === undefined ||
          nextKey === value ||
          retainedKeys.has(nextKey) ||
          (pendingTargets.get(nextKey) ?? 0) > 1
        ) {
          continue;
        }

        applied.add(entry);
        foundRewrite = true;
      }
    }

    for (const { key, nextKey } of applied) {
      if (nextKey === undefined) {
        continue;
      }

      key.value = nextKey;
      changed = true;
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
