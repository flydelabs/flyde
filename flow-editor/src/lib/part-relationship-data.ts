import { CustomPart, Project, isGroupedPart, GroupedPart, isCodePart, FlydeFlow } from "@flyde/core";
import { keys, values } from "../utils";

export type PartsRelationshipNode = {
  part: CustomPart;
  parent?: PartsRelationshipNode;
  children: PartsRelationshipNode[];
  usedByPartIds: string[];
};

export type PartsRelationshipData = {
  all: PartsRelationshipNode[];
  nodeMap: Record<string, PartsRelationshipNode>;
  triggers: {
    nodes: PartsRelationshipNode[];
    ids: Set<string>;
  };
  shared: {
    nodes: PartsRelationshipNode[];
    ids: Set<string>;
  };
  orphan: {
    nodes: PartsRelationshipNode[];
    ids: Set<string>;
  };
};

export const isFlow = (pOrF: Project | FlydeFlow): pOrF is FlydeFlow => {
  return (pOrF as FlydeFlow).parts !== undefined;
}

export const isProject = (pOrF: Project | FlydeFlow): pOrF is Project => {
  return (pOrF as Project).customRepo !== undefined;
}

export const buildPartsRelationshipData = (projectOrFlow: Project | FlydeFlow): PartsRelationshipData => {

  const parts = isFlow(projectOrFlow) ? projectOrFlow.parts : projectOrFlow.customRepo;
  const triggers = isFlow(projectOrFlow) ? [] : projectOrFlow.triggers;


  const partsUsingOtherMap = values(parts).reduce<Record<string, string[]>>(
    (acc, currPart) => {
      if (isGroupedPart(currPart)) {
        currPart.instances.forEach((ins) => {
          if (parts[ins.partId]) {
            const curr = acc[ins.partId] || [];
            if (!curr.includes(currPart.id) && ins.partId !== currPart.id) {
              acc[ins.partId] = [...curr, currPart.id];
            }
          }
        });
      }
      return acc;
    },
    {}
  );

  const traversedParts = new Set();

  const getUsages = (partId: string) => {
    return partsUsingOtherMap[partId] || [];
  };

  const map: Record<string, PartsRelationshipNode> = {};

  const traversePart = (mainPart: GroupedPart, parent?: PartsRelationshipNode) => {
    return mainPart.instances.reduce<PartsRelationshipNode[]>((acc, { partId }) => {
      const usages = partsUsingOtherMap[partId] || [];
      if (usages.length > 1) {
        // multi used, not relevant
        return acc;
      }
      const part = parts[partId];
      if (!part) {
        // std lib
        return acc;
        // throw new Error(`cant find part ${partId} inside grouped part ${mainPart.id}`);
      }

      if (isCodePart(part)) {
        traversedParts.add(part.id);
        const item: PartsRelationshipNode = {
          part,
          parent,
          children: [],
          usedByPartIds: getUsages(partId),
        };
        map[part.id] = item;
        return [...acc, item];
      } else {
        if (traversedParts.has(partId)) {
          // recursive
          return acc;
        }
        traversedParts.add(part.id);
        let item: PartsRelationshipNode = {
          part,
          parent,
          children: [],
          usedByPartIds: getUsages(partId),
        };
        item.children = traversePart(part, item);
        map[part.id] = item;
        return [...acc, item];
      }
    }, []);
  };

  const triggerPartIds = triggers.map((t) => t.partId);
  const triggerPartIdsSet = new Set(triggerPartIds);
  

  // start with root parts which are not shared - meaning no one uses them
  const rootNodes = values(parts)
    .filter((p) => {
      const u = partsUsingOtherMap[p.id] || [];
      return u.length === 0 && triggerPartIdsSet.has(p.id);
    })
    .map((part) => {
      traversedParts.add(part.id);

      const item: PartsRelationshipNode = {
        part,
        children: [],
        usedByPartIds: getUsages(part.id),
      };
      item.children = traversePart(part as GroupedPart, item);
      map[part.id] = item;
      return item;
    })
    .sort(
      (nodeA, nodeB) =>
        triggerPartIds.indexOf(nodeA.part.id) - triggerPartIds.indexOf(nodeB.part.id)
    );

  // then continue with nodes being used by more than 2 that were not traversed yet
  const sharedNodes = values(parts)
    .filter((p) => {
      const u = partsUsingOtherMap[p.id] || [];
      return u.length > 1 && !traversedParts.has(p.id);
    })
    .map((part) => {
      traversedParts.add(part.id);
      const item: PartsRelationshipNode = {
        part,
        children: [],
        usedByPartIds: getUsages(part.id),
      };
      if (isGroupedPart(part)) {
        item.children = traversePart(part, item);
      }
      map[part.id] = item;
      return item;
    });

  const orphanNodes = values(parts)
    .filter((p) => {
      const u = partsUsingOtherMap[p.id] || [];
      return u.length === 0 && !traversedParts.has(p.id);
    })
    .map((part) => {
      traversedParts.add(part.id);
      const item: PartsRelationshipNode = {
        part,
        children: [],
        usedByPartIds: getUsages(part.id),
      };
      if (isGroupedPart(part)) {
        item.children = traversePart(part, item);
      }
      map[part.id] = item;
      return item;
    });

  if (keys(parts).length !== traversedParts.size) {
    // just to be on the safe side, as the effects of an error here might be very hard to find
    throw new Error(`built incomplete relationship graph - ${keys(parts).length} parts, but only ${traversedParts.size} traversed`);
  }

  const sharedIds = new Set(sharedNodes.map((n) => n.part.id));
  const orphanIds = new Set(orphanNodes.map((n) => n.part.id));

  return {
    all: [...rootNodes, ...sharedNodes, ...orphanNodes],
    triggers: {
      nodes: rootNodes,
      ids: triggerPartIdsSet,
    },
    shared: {
      nodes: sharedNodes,
      ids: sharedIds,
    },
    orphan: {
      nodes: orphanNodes,
      ids: orphanIds,
    },
    nodeMap: map,
  };
};
