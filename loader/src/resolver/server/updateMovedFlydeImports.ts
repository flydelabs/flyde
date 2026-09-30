import { dirname, relative, resolve } from "path";
import { parseDocument, isMap, isSeq } from "yaml";

export interface MovedFile {
  /** Absolute path of the file before the move/rename */
  oldPath: string;
  /** Absolute path of the file after the move/rename */
  newPath: string;
}

const toPosixPath = (p: string) => p.split("\\").join("/");

/**
 * Rewrites the relative `source.data` file references inside a .flyde flow
 * after a file in the workspace was moved or renamed.
 *
 * Handles both directions:
 * - an imported file was moved: references resolving to `move.oldPath` are
 *   re-pointed at `move.newPath`
 * - the flow file itself was moved (`flowPathBefore` !== `flowPathAfter`):
 *   every relative file reference is re-relativized against the new location
 *
 * Edits are applied through the YAML document AST so unrelated formatting and
 * content are preserved. Returns the updated contents, or `null` when no
 * reference needed updating.
 */
export function updateFlydeImportsAfterMove(
  flowContents: string,
  flowPathBefore: string,
  flowPathAfter: string,
  move: MovedFile
): string | null {
  const doc = parseDocument(flowContents);
  if (doc.errors.length > 0) {
    return null;
  }

  const instances = doc.getIn(["node", "instances"], true);
  if (!isSeq(instances)) {
    return null;
  }

  const oldTarget = resolve(move.oldPath);
  let changed = false;

  for (const instance of instances.items) {
    if (!isMap(instance)) {
      continue;
    }
    const source = instance.get("source", true);
    if (!isMap(source) || source.get("type") !== "file") {
      continue;
    }
    const data = source.get("data");
    if (typeof data !== "string" || data === "") {
      continue;
    }

    const targetBefore = resolve(dirname(flowPathBefore), data);
    const targetAfter = targetBefore === oldTarget ? resolve(move.newPath) : targetBefore;

    if (targetAfter === targetBefore && flowPathBefore === flowPathAfter) {
      continue;
    }

    let newData = toPosixPath(relative(dirname(flowPathAfter), targetAfter));
    if (!newData.startsWith(".")) {
      newData = `./${newData}`;
    }

    if (newData !== data) {
      source.set("data", newData);
      changed = true;
    }
  }

  return changed ? String(doc) : null;
}
