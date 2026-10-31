export interface ImportPathMove {
  from: string;
  to: string;
}

export interface ImportPathMoveContext {
  moves: ImportPathMove[];
  flowBefore: string;
  flowAfter: string;
}

type FlowNodeLike = { instances: any[] };

const toPosix = (value: string) => value.replace(/\\/g, "/");

const hasDrivePrefix = (value: string) => /^[A-Za-z]:\//.test(value);

const normalizePath = (value: string): string => {
  const posix = toPosix(value);
  const absolute = posix.startsWith("/") || hasDrivePrefix(posix);
  const drive = hasDrivePrefix(posix) ? posix.slice(0, 2) : "";
  const rest = drive ? posix.slice(2) : posix;
  const parts: string[] = [];

  for (const part of rest.split("/")) {
    if (part === "" || part === ".") {
      continue;
    }
    if (part === "..") {
      if (parts.length > 0 && parts[parts.length - 1] !== "..") {
        parts.pop();
      } else if (!absolute) {
        parts.push(part);
      }
      continue;
    }
    parts.push(part);
  }

  const prefix = drive ? `${drive}/` : absolute ? "/" : "";
  return `${prefix}${parts.join("/")}` || (absolute ? prefix : ".");
};

const dirname = (value: string): string => {
  const normalized = normalizePath(value);
  const index = normalized.lastIndexOf("/");
  if (index <= 0) {
    return index === 0 ? "/" : ".";
  }
  return normalized.slice(0, index);
};

const isAbsolute = (value: string): boolean => {
  const posix = toPosix(value);
  return posix.startsWith("/") || hasDrivePrefix(posix);
};

const resolvePath = (baseDir: string, value: string): string => {
  if (isAbsolute(value)) {
    return normalizePath(value);
  }
  return normalizePath(`${baseDir}/${value}`);
};

const relativePath = (
  fromDir: string,
  target: string,
  caseInsensitive: boolean
): string | undefined => {
  const from = normalizePath(fromDir);
  const to = normalizePath(target);
  const fromDrive = hasDrivePrefix(from) ? from.slice(0, 2).toLowerCase() : "";
  const toDrive = hasDrivePrefix(to) ? to.slice(0, 2).toLowerCase() : "";
  if (fromDrive !== toDrive) {
    return undefined;
  }

  const fromParts = from.split("/").filter(Boolean);
  const toParts = to.split("/").filter(Boolean);
  let common = 0;
  while (common < fromParts.length && common < toParts.length) {
    const left = fromParts[common];
    const right = toParts[common];
    if (
      (caseInsensitive ? left.toLowerCase() : left) !==
      (caseInsensitive ? right.toLowerCase() : right)
    ) {
      break;
    }
    common += 1;
  }

  const up = new Array(fromParts.length - common).fill("..");
  const down = toParts.slice(common);
  const joined = [...up, ...down].join("/");
  return joined || ".";
};

const pathKey = (value: string, caseInsensitive: boolean): string => {
  const normalized = normalizePath(value);
  return caseInsensitive ? normalized.toLowerCase() : normalized;
};

const mapThroughMoves = (
  absolutePath: string,
  moves: ImportPathMove[],
  caseInsensitive: boolean
): string => {
  let current = normalizePath(absolutePath);
  for (const move of moves) {
    const from = normalizePath(move.from);
    const to = normalizePath(move.to);
    const key = pathKey(current, caseInsensitive);
    const fromKey = pathKey(from, caseInsensitive);
    if (key === fromKey) {
      current = to;
      continue;
    }
    if (key.startsWith(`${fromKey}/`)) {
      current = `${to}${current.slice(from.length)}`;
    }
  }
  return current;
};

const preserveSeparators = (source: string, mapped: string): string =>
  source.includes("\\") && !source.includes("/")
    ? mapped.split("/").join("\\")
    : mapped;

/**
 * Creates the per-flow mapper used for both the open flow and the state the
 * editor retains for paste/undo. The mapper resolves paths against the flow's
 * pre-move location, so it also repairs references that only exist in unsaved
 * editor state and therefore were never present in the TextDocument scan.
 */
export const createImportPathMapper = (
  context: ImportPathMoveContext
): ((source: string) => string) => {
  const beforeDir = dirname(context.flowBefore);
  const afterDir = dirname(context.flowAfter);
  const caseInsensitive =
    hasDrivePrefix(context.flowBefore) || context.flowBefore.includes("\\");

  return (source: string): string => {
    if (context.moves.length === 0 || typeof source !== "string") {
      return source;
    }

    const absoluteTarget = isAbsolute(source)
      ? normalizePath(source)
      : resolvePath(beforeDir, source);
    const movedTarget = mapThroughMoves(
      absoluteTarget,
      context.moves,
      caseInsensitive
    );
    const nextRelative = relativePath(
      afterDir,
      movedTarget,
      caseInsensitive
    );

    if (nextRelative === undefined) {
      return source;
    }

    const nextData = preserveSeparators(source, nextRelative);
    return nextData === source ? source : nextData;
  };
};

/**
 * Applies path moves recursively to a flow node. Also updates the resolved
 * inline `node` copies the editor keeps next to `source.data`; otherwise an
 * already-open group or a later duplicate would still see the old path.
 */
export const applyImportPathMoves = <T extends FlowNodeLike>(
  node: T,
  context: ImportPathMoveContext
): T => {
  if (context.moves.length === 0) {
    return node;
  }

  const mapPath = createImportPathMapper(context);

  const applyNode = <N extends FlowNodeLike>(current: N): N => {
    let changed = false;
    const instances = current.instances.map((instance) => {
      let next = instance;

      if (
        instance.source?.type === "file" &&
        typeof instance.source.data === "string"
      ) {
        const replacement = mapPath(instance.source.data);
        if (replacement !== instance.source.data) {
          next = {
            ...next,
            source: { ...next.source, data: replacement },
          };
        }
      }

      if (instance.source?.type === "inline" && instance.source.data) {
        const nextData = applyNode(instance.source.data as FlowNodeLike);
        if (nextData !== instance.source.data) {
          next = {
            ...next,
            source: { ...next.source, data: nextData },
          };
        }
      }

      // A file instance's resolved `node` belongs to the imported flow, so its
      // internal paths are relative to that file, not to this flow. Only an
      // inline group shares this flow's path base.
      if (
        next.source?.type === "inline" &&
        next.node &&
        Array.isArray(next.node.instances)
      ) {
        const nextResolved = applyNode(next.node as FlowNodeLike);
        if (nextResolved !== next.node) {
          next = { ...next, node: nextResolved };
        }
      }

      if (next !== instance) {
        changed = true;
      }
      return next;
    });

    return changed ? ({ ...current, instances } as N) : current;
  };

  return applyNode(node);
};
