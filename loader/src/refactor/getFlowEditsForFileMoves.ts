import * as nodePath from "path";
import { isMap, isScalar, isSeq, parseDocument, Scalar, stringify } from "yaml";

export interface FileMove {
  oldPath: string;
  newPath: string;
}

export interface FlowTextEdit {
  start: number;
  end: number;
  newText: string;
}

type PathModule = nodePath.PlatformPath;

interface SourcePathScalar {
  scalar: Scalar<string>;
  inFlowCollection: boolean;
}

/**
 * Returns the text edits that keep a flow's relative file imports pointing at
 * the same files after `moves` were applied. `flowPath` is the flow's location
 * after the moves. Only the affected path scalars are replaced, so formatting
 * and comments are preserved.
 */
export function getFlowEditsForFileMoves(
  flowContent: string,
  flowPath: string,
  moves: FileMove[],
  path: PathModule = nodePath
): FlowTextEdit[] {
  if (moves.length === 0) {
    return [];
  }

  const previousFlowPath =
    relocate(flowPath, moves, "newPath", "oldPath", path) ?? flowPath;

  if (
    previousFlowPath === flowPath &&
    !mentionsAnyMovedName(flowContent, moves, path)
  ) {
    return [];
  }

  const doc = parseDocument(flowContent);
  if (doc.errors.length > 0) {
    return [];
  }

  const edits: FlowTextEdit[] = [];

  for (const { scalar, inFlowCollection } of sourcePathScalars(
    doc.get("node")
  )) {
    const specifier = scalar.value;
    const previousTarget = path.join(previousFlowPath, "..", specifier);
    const target =
      relocate(previousTarget, moves, "oldPath", "newPath", path) ??
      previousTarget;

    if (path.join(flowPath, "..", specifier) === target || !scalar.range) {
      continue;
    }

    const newSpecifier = toSpecifier(flowPath, target, specifier, path);
    if (newSpecifier === undefined) {
      continue;
    }

    edits.push({
      start: scalar.range[0],
      end: scalar.range[1],
      newText: renderScalar(newSpecifier, scalar, inFlowCollection),
    });
  }

  return edits;
}

function* sourcePathScalars(
  visualNode: unknown
): Generator<SourcePathScalar> {
  if (!isMap(visualNode)) {
    return;
  }

  const instances = visualNode.get("instances");
  if (!isSeq(instances)) {
    return;
  }

  for (const instance of instances.items) {
    const source = isMap(instance) ? instance.get("source") : undefined;
    if (!isMap(source)) {
      continue;
    }

    const type = source.get("type");
    const data = source.get("data", true);

    if (type === "inline") {
      yield* sourcePathScalars(data);
    } else if (
      isScalar(data) &&
      typeof data.value === "string" &&
      isPathSource(type, data.value)
    ) {
      yield {
        scalar: data as Scalar<string>,
        inFlowCollection: source.flow === true,
      };
    }
  }
}

function isPathSource(type: unknown, data: string): boolean {
  return type === "file" || (type === "package" && /^\.\.?([\\/]|$)/.test(data));
}

function relocate(
  filePath: string,
  moves: FileMove[],
  from: keyof FileMove,
  to: keyof FileMove,
  path: PathModule
): string | undefined {
  let match: { base: string; rest: string; length: number } | undefined;

  for (const move of moves) {
    const rest = path.relative(move[from], filePath);
    const isInside =
      rest !== ".." &&
      !rest.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(rest);

    if (isInside && (!match || move[from].length > match.length)) {
      match = { base: move[to], rest, length: move[from].length };
    }
  }

  return match ? path.join(match.base, match.rest) : undefined;
}

function mentionsAnyMovedName(
  content: string,
  moves: FileMove[],
  path: PathModule
): boolean {
  const haystack = content.toLowerCase();
  return moves.some(({ oldPath }) =>
    haystack.includes(path.basename(oldPath).toLowerCase())
  );
}

function toSpecifier(
  flowPath: string,
  target: string,
  originalSpecifier: string,
  path: PathModule
): string | undefined {
  const relativePath = path.relative(path.dirname(flowPath), target);
  if (relativePath === "" || path.isAbsolute(relativePath)) {
    return undefined;
  }

  const portablePath = relativePath.split(path.sep).join("/");
  const keepDotPrefix =
    /^\.[\\/]/.test(originalSpecifier) && !portablePath.startsWith("../");

  return keepDotPrefix ? `./${portablePath}` : portablePath;
}

function renderScalar(
  value: string,
  original: Scalar,
  inFlowCollection: boolean
): string {
  const isQuoted =
    original.type === Scalar.QUOTE_SINGLE ||
    original.type === Scalar.QUOTE_DOUBLE;

  const style = isQuoted
    ? original.type
    : inFlowCollection && /[,[\]{}]/.test(value)
      ? Scalar.QUOTE_DOUBLE
      : Scalar.PLAIN;

  return stringify(value, { defaultStringType: style, lineWidth: 0 }).replace(
    /\n$/,
    ""
  );
}
