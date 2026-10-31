type FlowInstanceLike = {
  id: string;
  source?: { type: string; data?: unknown };
};

type FlowNodeLike = {
  instances: FlowInstanceLike[];
};

const collectInstances = (
  node: FlowNodeLike,
  collected = new Map<string, FlowInstanceLike[]>()
) => {
  for (const instance of node.instances) {
    const matches = collected.get(instance.id) ?? [];
    matches.push(instance);
    collected.set(instance.id, matches);

    if (instance.source?.type === "inline" && instance.source.data) {
      collectInstances(instance.source.data as FlowNodeLike, collected);
    }
  }

  return collected;
};

const findUnambiguousMatch = (
  onDiskById: Map<string, FlowInstanceLike[]>,
  incomingById: Map<string, FlowInstanceLike[]>,
  instanceId: string
) => {
  // Only borrow a path across scopes when the id is unambiguous on both sides.
  // Otherwise a new instance that happens to reuse an id would inherit an
  // unrelated import path.
  if ((incomingById.get(instanceId)?.length ?? 0) !== 1) {
    return undefined;
  }

  const candidates = onDiskById.get(instanceId) ?? [];
  return candidates.length === 1 ? candidates[0] : undefined;
};

/**
 * Copies relative file import paths from the flow on disk onto an incoming flow.
 * Keeps unsaved editor state while making disk-authoritative import repairs win.
 */
export function mergeFileImportPaths<T extends FlowNodeLike>(
  incoming: T,
  onDisk: FlowNodeLike
): T {
  const onDiskById = collectInstances(onDisk);
  const incomingById = collectInstances(incoming);

  const mergeNode = (node: T, diskNode: FlowNodeLike | undefined): T => ({
    ...node,
    instances: node.instances.map((instance) => {
      const sameScope = diskNode?.instances.find(
        (diskInstance) => diskInstance.id === instance.id
      );
      const match =
        sameScope ?? findUnambiguousMatch(onDiskById, incomingById, instance.id);
      let merged = instance;

      if (
        match &&
        instance.source?.type === "file" &&
        match.source?.type === "file"
      ) {
        merged = {
          ...merged,
          source: { ...merged.source, data: match.source.data },
        };
      }

      if (instance.source?.type === "inline" && instance.source.data) {
        let diskChild: FlowNodeLike | undefined;
        if (sameScope?.source?.type === "inline" && sameScope.source.data) {
          diskChild = sameScope.source.data as FlowNodeLike;
        } else if (
          match?.source?.type === "inline" &&
          match.source.data
        ) {
          diskChild = match.source.data as FlowNodeLike;
        }

        merged = {
          ...merged,
          source: {
            ...merged.source,
            data: mergeNode(instance.source.data as T, diskChild),
          },
        };
      }

      return merged;
    }),
  });

  return mergeNode(incoming, onDisk);
}
