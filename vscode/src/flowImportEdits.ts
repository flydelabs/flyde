import { posix as path } from "path";
import { isMap, isScalar, isSeq, parseDocument, Scalar, YAMLMap } from "yaml";

export interface FileMove {
  oldPath: string;
  newPath: string;
}

export interface ImportEdit {
  start: number;
  end: number;
  text: string;
}

export function getFlowImportEdits(
  text: string,
  flowPath: string,
  moves: readonly FileMove[]
): ImportEdit[] {
  const normalizeDrive = (value: string) => value.replace(/^\/([A-Z]):/, (_, drive: string) => `/${drive.toLowerCase()}:`);
  flowPath = normalizeDrive(flowPath);
  moves = moves.map(({ oldPath, newPath }) => ({
    oldPath: normalizeDrive(oldPath), newPath: normalizeDrive(newPath),
  }));
  const document = parseDocument(text);
  if (document.errors.length) {
    throw new Error(document.errors.map((error) => error.message).join("\n"));
  }
  const sortedMoves = [...moves].sort((a, b) => b.oldPath.length - a.oldPath.length);
  const movedPath = (original: string) => {
    const move = sortedMoves.find(({ oldPath }) =>
      original === oldPath || original.startsWith(oldPath + "/")
    );
    return move ? move.newPath + original.slice(move.oldPath.length) : original;
  };
  const oldDirectory = path.dirname(flowPath);
  const newDirectory = path.dirname(movedPath(flowPath));
  const edits: ImportEdit[] = [];

  const updateSource = (scalar: Scalar) => {
    if (typeof scalar.value !== "string" || !scalar.range) {
      return;
    }
    const reference = scalar.value.replace(/\\/g, "/");
    const absolute = path.isAbsolute(reference);
    const oldTarget = path.resolve(oldDirectory, reference);
    const newTarget = movedPath(oldTarget);
    if (newTarget === oldTarget && newDirectory === oldDirectory) {
      return;
    }
    let next = absolute ? newTarget : path.relative(newDirectory, newTarget);
    if (!absolute && !next.startsWith(".")) {
      next = "./" + next;
    }
    if (path.resolve(newDirectory, reference) === newTarget) {
      return;
    }
    edits.push({ start: scalar.range[0], end: scalar.range[1], text: JSON.stringify(next) });
  };

  const visitNode = (node: unknown) => {
    if (!isMap(node)) {
      return;
    }
    const instances = node.get("instances", true);
    if (!isSeq(instances)) {
      return;
    }
    for (const instance of instances.items) {
      if (!isMap(instance)) {
        continue;
      }
      const source = instance.get("source", true);
      if (isMap(source)) {
        const data = source.get("data", true);
        if (source.get("type") === "file" && isScalar(data)) {
          updateSource(data);
        } else if (source.get("type") === "inline") {
          visitNode(data);
        }
      }
      visitNode(instance.get("node", true));
    }
  };

  if (isMap(document.contents)) {
    const flow = document.contents as YAMLMap;
    visitNode(flow.get("node", true));
    const imports = flow.get("imports", true);
    if (isMap(imports)) {
      for (const entry of imports.items) {
        if (isScalar(entry.key) && typeof entry.key.value === "string" &&
          (/^(\.{1,2}[/\\]|\/)/.test(entry.key.value) || /\.flyde(?:\.[jt]s)?$/.test(entry.key.value))) {
          updateSource(entry.key);
        }
      }
    }
  }
  return edits;
}
