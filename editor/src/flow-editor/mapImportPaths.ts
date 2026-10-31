export type ImportPathMapper = (source: string) => string;

type FlowNodeLike = { instances: any[] };

/**
 * Maps file import paths in a flow, including inline groups and the resolved
 * `node` copy the editor keeps next to an inline source. Only `type: file`
 * sources change; positions, package sources and all other fields stay put.
 */
export const mapImportPathsInNode = <T extends FlowNodeLike>(
  node: T,
  mapper: ImportPathMapper
): T => {
  let changed = false;
  const instances = node.instances.map((instance) => {
    let next = instance;

    if (
      instance.source?.type === "file" &&
      typeof instance.source.data === "string"
    ) {
      const mapped = mapper(instance.source.data);
      if (mapped !== instance.source.data) {
        next = { ...next, source: { ...next.source, data: mapped } };
      }
    }

    if (instance.source?.type === "inline" && instance.source.data) {
      const mapped = mapImportPathsInNode(instance.source.data, mapper);
      if (mapped !== instance.source.data) {
        next = { ...next, source: { ...next.source, data: mapped } };
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
      const mapped = mapImportPathsInNode(next.node, mapper);
      if (mapped !== next.node) {
        next = { ...next, node: mapped };
      }
    }

    if (next !== instance) {
      changed = true;
    }
    return next;
  });

  return changed ? ({ ...node, instances } as T) : node;
};

export const mapClipboardImportPaths = <
  T extends { instances: any[]; connections?: any[] }
>(
  clipboard: T,
  mapper: ImportPathMapper
): T => {
  const instances = clipboard.instances.map((instance) => {
    const mapped = mapImportPathsInNode(
      { instances: [instance] },
      mapper
    ).instances[0];
    return mapped ?? instance;
  });
  const changed = instances.some(
    (instance, index) => instance !== clipboard.instances[index]
  );
  return changed ? { ...clipboard, instances } : clipboard;
};
