import * as path from "path";
import { isMap, isScalar, parseDocument, visit } from "yaml";

export interface FileMove {
  oldPath: string;
  newPath: string;
}

export function movedPath(file: string, moves: readonly FileMove[]): string {
  const match = moves
    .filter(({ oldPath }) => {
      const relative = path.relative(oldPath, file);
      return (
        relative === "" ||
        (!path.isAbsolute(relative) &&
          relative !== ".." &&
          !relative.startsWith(`..${path.sep}`))
      );
    })
    .sort((a, b) => b.oldPath.length - a.oldPath.length)[0];
  return match
    ? path.join(match.newPath, path.relative(match.oldPath, file))
    : file;
}

function rebaseImportSpecifier(
  specifier: string,
  oldFlowPath: string,
  newFlowPath: string,
  moves: readonly FileMove[]
): string | undefined {
  const oldTarget = path.resolve(path.dirname(oldFlowPath), specifier);
  const newTarget = movedPath(oldTarget, moves);
  if (oldTarget === newTarget && oldFlowPath === newFlowPath) {
    return undefined;
  }
  let next = path.isAbsolute(specifier)
    ? newTarget
    : path
        .relative(path.dirname(newFlowPath), newTarget)
        .split(path.sep)
        .join("/");
  if (!path.isAbsolute(specifier) && !next.startsWith(".")) {
    next = `./${next}`;
  }
  return next !== specifier ? next : undefined;
}

export function remapFlowPaths(
  text: string,
  flowPath: string,
  moves: readonly FileMove[]
): string | undefined {
  const document = parseDocument(text);
  if (document.errors.length) {
    throw new Error(document.errors.map((error) => error.message).join("; "));
  }
  const newFlowPath = movedPath(flowPath, moves);
  let changed = false;

  visit(document, {
    Map(_key, node) {
      const source = node.get("source", true);
      if (!isMap(source) || source.get("type") !== "file") {
        return;
      }
      const data = source.get("data", true);
      if (
        !isScalar(data) ||
        typeof data.value !== "string" ||
        !data.value
      ) {
        return;
      }
      const next = rebaseImportSpecifier(
        data.value,
        flowPath,
        newFlowPath,
        moves
      );
      if (next !== undefined) {
        data.value = next;
        changed = true;
      }
    },
  });

  const importsNode = document.get("imports", true);
  if (isMap(importsNode)) {
    for (const pair of importsNode.items) {
      if (
        isScalar(pair.key) &&
        typeof pair.key.value === "string" &&
        (pair.key.value.startsWith(".") || path.isAbsolute(pair.key.value))
      ) {
        const next = rebaseImportSpecifier(
          pair.key.value,
          flowPath,
          newFlowPath,
          moves
        );
        if (next !== undefined) {
          pair.key.value = next;
          changed = true;
        }
      }
    }
  }

  return changed ? document.toString() : undefined;
}