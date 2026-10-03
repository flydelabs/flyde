import * as path from "path";
import * as yaml from "yaml";

export type FlowPathRename = { oldPath: string; newPath: string };

/**
 * Update file references using the importer's pre-rename absolute path.
 * The whole batch is applied once, so moving an importer and a dependency
 * together does not resolve a reference against an intermediate location.
 * Only scalar ranges are replaced; formatting and unrelated flow data survive.
 */
export function updateFlowPathsForRenames(
  raw: string,
  flowPath: string,
  renames: FlowPathRename[]
): string | undefined {
  if (renames.length === 0) return undefined;

  const fail = (reason: string): never => {
    throw new Error(`Cannot update file references in ${flowPath}: ${reason}`);
  };
  const paths = /^[A-Za-z]:[\\/]|^\\\\/.test(flowPath) ? path.win32 : path;
  if (!paths.isAbsolute(flowPath)) fail("the original flow path must be absolute");

  const moves = renames.map(({ oldPath, newPath }) => {
    if (!paths.isAbsolute(oldPath) || !paths.isAbsolute(newPath)) {
      fail("rename paths must be absolute");
    }
    return { oldPath: paths.normalize(oldPath), newPath: paths.normalize(newPath) };
  });
  const destinations = new Map<string, string>();
  const origins = new Map<string, string>();
  for (const move of moves) {
    if (origins.has(move.oldPath) && origins.get(move.oldPath) !== move.newPath) {
      fail("the rename batch has conflicting destinations");
    }
    if (destinations.has(move.newPath) && destinations.get(move.newPath) !== move.oldPath) {
      fail("the rename batch has colliding destinations");
    }
    origins.set(move.oldPath, move.newPath);
    destinations.set(move.newPath, move.oldPath);
  }
  moves.sort((a, b) => b.oldPath.length - a.oldPath.length);

  const mapPath = (original: string): string => {
    const normalized = paths.normalize(original);
    for (const move of moves) {
      const relative = paths.relative(move.oldPath, normalized);
      if (relative === "") return move.newPath;
      if (!paths.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${paths.sep}`)) {
        return paths.join(move.newPath, relative);
      }
    }
    return normalized;
  };

  const oldFlowPath = paths.normalize(flowPath);
  const oldDirectory = paths.dirname(oldFlowPath);
  const newDirectory = paths.dirname(mapPath(oldFlowPath));
  const portablePath = (value: string) => paths === path.win32 ? value.replace(/\\/g, "/") : value;
  const rewrittenPath = (value: string): string => {
    const absolute = paths.isAbsolute(value);
    const oldTarget = paths.resolve(oldDirectory, value);
    const newTarget = mapPath(oldTarget);
    if (newTarget === oldTarget && (absolute || newDirectory === oldDirectory)) return value;
    if (absolute) return portablePath(newTarget);
    const relative = portablePath(paths.relative(newDirectory, newTarget));
    // Keep bare relative imports bare; preserve the explicit ./ convention.
    return value.startsWith("./") || value.startsWith(".\\")
      ? relative.startsWith(".") || paths.isAbsolute(relative) ? relative : `./${relative}`
      : relative;
  };

  const document = yaml.parseDocument(raw, { keepSourceTokens: true });
  if (document.errors.length) fail("invalid YAML");
  if (!yaml.isMap(document.contents)) return undefined;

  const aliases = new Set<string>();
  yaml.visit(document, {
    Alias: (_key, alias) => { aliases.add(alias.source); },
  });
  const edits: { start: number; end: number; value: string }[] = [];
  const checkAlias = (node: unknown): void => {
    if (yaml.isAlias(node) || (yaml.isNode(node) && node.anchor && aliases.has(node.anchor))) {
      fail("an aliased reference cannot be changed without affecting other data");
    }
  };
  const get = (map: yaml.YAMLMap, key: string): unknown => {
    const value = map.get(key, true);
    checkAlias(value);
    return value;
  };
  const replaceScalar = (scalar: yaml.Scalar, value: string): void => {
    if (scalar.value === value) return;
    checkAlias(scalar);
    if (!scalar.range || scalar.type === "BLOCK_FOLDED" || scalar.type === "BLOCK_LITERAL") {
      fail("a multiline reference cannot be rewritten safely");
    }
    let encoded: string;
    if (scalar.type === "QUOTE_SINGLE") {
      encoded = `'${value.replace(/'/g, "''")}'`;
    } else if (scalar.type === "QUOTE_DOUBLE") {
      encoded = JSON.stringify(value);
    } else {
      const plain = yaml.parseDocument(value);
      // Flow collections interpret these delimiters even inside otherwise valid plain scalars.
      encoded = !/[,\[\]{}]/.test(value) && !plain.errors.length && yaml.isScalar(plain.contents) && plain.contents.value === value
        ? value
        : JSON.stringify(value);
    }
    edits.push({ start: scalar.range[0], end: scalar.range[1], value: encoded });
  };

  const walkVisualNode = (node: unknown): void => {
    checkAlias(node);
    if (!yaml.isMap(node)) return;
    const instances = get(node, "instances");
    if (!yaml.isSeq(instances)) return;
    for (const instance of instances.items) {
      checkAlias(instance);
      if (!yaml.isMap(instance)) continue;
      const source = get(instance, "source");
      if (yaml.isMap(source)) {
        const type = get(source, "type");
        if (yaml.isScalar(type) && type.value === "file") {
          const data = get(source, "data");
          if (yaml.isScalar(data) && typeof data.value === "string") {
            replaceScalar(data, rewrittenPath(data.value));
          }
        } else if (yaml.isScalar(type) && type.value === "inline") {
          walkVisualNode(get(source, "data"));
        }
      }
      // Older flows embed inline visual nodes directly in the instance.
      walkVisualNode(get(instance, "node"));
    }
  };
  walkVisualNode(get(document.contents, "node"));

  const imports = get(document.contents, "imports");
  if (yaml.isMap(imports)) {
    const rewrittenKeys = new Set<string>();
    for (const entry of imports.items) {
      checkAlias(entry.key);
      if (!yaml.isScalar(entry.key) || typeof entry.key.value !== "string") continue;
      const key = entry.key.value;
      // Match the legacy migration's file suffixes, never a package import.
      const fileImport = !key.startsWith("@") && /\.flyde(?:\.(?:ts|js))?$/.test(key);
      const newKey = fileImport ? rewrittenPath(key) : key;
      if (rewrittenKeys.has(newKey)) fail("rewritten legacy import keys would collide");
      rewrittenKeys.add(newKey);
      if (fileImport) replaceScalar(entry.key, newKey);
    }
  }

  if (!edits.length) return undefined;
  edits.sort((a, b) => b.start - a.start);
  let result = raw;
  let previousStart = raw.length;
  for (const edit of edits) {
    if (edit.end > previousStart) fail("overlapping YAML scalar ranges");
    result = result.slice(0, edit.start) + edit.value + result.slice(edit.end);
    previousStart = edit.start;
  }
  return result;
}
