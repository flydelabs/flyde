interface PendingImportPathRepair {
  contents: string;
  version?: number;
}

const pendingImportPathRepairs = new Map<
  string,
  PendingImportPathRepair
>();

/**
 * Remembers the exact contents and, once known, the document version a repair
 * produced for each file. Every editor panel for that document checks the
 * marker, so it must not be consumed by the first listener: split custom
 * editors share one TextDocument but have separate listeners and webview state.
 *
 * `importPathUpdates` clears the marker after a short TTL, once every listener
 * has had a chance to see the repaired content.
 */
export const markImportPathRepairs = (
  repairs: { filePath: string; contents: string; version?: number }[]
) => {
  repairs.forEach(({ filePath, contents, version }) =>
    pendingImportPathRepairs.set(filePath, { contents, version })
  );
};

export const clearImportPathRepairs = (filePaths: string[]) => {
  filePaths.forEach((filePath) => pendingImportPathRepairs.delete(filePath));
};

/**
 * Returns true for every listener that sees the repair. When the post-apply
 * document version is known, only that version is suppressed; an external edit
 * that happens to restore identical contents later is not mistaken for the
 * repair.
 */
export const isImportPathRepair = (
  filePath: string,
  contents: string,
  version?: number
) => {
  const repair = pendingImportPathRepairs.get(filePath);
  if (!repair) {
    return false;
  }
  if (repair.version !== undefined && version !== undefined) {
    return repair.version === version;
  }
  return repair.contents === contents;
};

export const getPendingImportPathRepairsForTests = (): ReadonlyMap<
  string,
  PendingImportPathRepair
> => pendingImportPathRepairs;
