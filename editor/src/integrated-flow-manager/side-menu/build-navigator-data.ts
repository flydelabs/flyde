import {
  FlydeFlow,
  isGroupedPart,
  isRefPartInstance,
  PartDefRepo,
  RefPartInstance,
} from "@flyde/core";
import { buildPartsRelationshipData, PartsRelationshipNode } from "@flyde/flow-editor"; // ../../../common/lib/part-relationship-data
import { NavigatorCodePartItem, NavigatorData, NavigatorInstanceGroup, NavigatorItem, NavigatorVisualPartItem } from "./FoldersSection/FlowPartsSection";


const typesOrder: Array<NavigatorItem['type']> = ['visual-part', 'code-part'];
export const navigatorItemSort = (item1: NavigatorItem, item2: NavigatorItem): number => {
  if (item1.type === item2.type) {
    return item1.label.localeCompare(item2.label);
  } else {
    const idx1 = typesOrder.indexOf(item1.type) || 10;
    const idx2 = typesOrder.indexOf(item2.type) || 10;
    return idx1 - idx2;
  }
};


export const buildNavigatorData = (
  flow: FlydeFlow,
  usage: Map<any, any>,
  stdLibRepo: PartDefRepo
): NavigatorData => {
  const { shared, orphan } = buildPartsRelationshipData(flow);

  const toNavigatorItem = (node: PartsRelationshipNode): NavigatorItem => {
    const part = node.part;

    const instances = isGroupedPart(part) ? part.instances : [];
    const instancesCount = instances.reduce<Record<string, number>>((acc, curr) => {
      if (isRefPartInstance(curr)) {
        const c = acc[curr.partId] || 0;
        acc[curr.partId] = c + 1;
      }
      return acc;
    }, {});

    const childPartNodes = node.children.map(toNavigatorItem);

    const refInstances = instances
      .filter((ins) => isRefPartInstance(ins)) as RefPartInstance[];

    const instancesNodes = refInstances
      .reduce<NavigatorItem[]>((acc, { partId, id }) => {
      const isExternal = !stdLibRepo[partId];
      const item: NavigatorItem = {
        type: isExternal ? "external-instance" : "internal-instance",
        id,
        label: partId,
      };

      if (instancesCount[partId] === 1) {
        return [...acc, item];
      }

      const existingGroup: NavigatorInstanceGroup = acc.find(
        (i) => i.type === "instance-group" && i.id === (part.id + partId)
      ) as NavigatorInstanceGroup;

      if (existingGroup) {
        existingGroup.children.push(item);
        return acc;
      } else {
      }
      const newGroup: NavigatorInstanceGroup = {
        type: "instance-group",
        id: part.id + partId,
        label: partId,
        children: [item],
        count: instancesCount[partId],
      };
      return [...acc, newGroup];
    }, []);

    if (isGroupedPart(part)) {
      const item: NavigatorVisualPartItem = {
        type: 'visual-part',
        usages: usage.get(part.id) || [],
        label: part.id,
        id: part.id,
        children: [
          ...childPartNodes,
          ...instancesNodes
        ],
        exported: flow.exports.includes(part.id),
        isMain: part.id === flow.mainId,
      }
      return item;
    } else {
      const item: NavigatorCodePartItem = {
        id: part.id,
        label: part.id,
        type: 'code-part',
        usages: usage.get(part.id) || [],
        exported: flow.exports.includes(part.id),
        isMain: part.id === flow.mainId,
      }
      return item;
    }
  };
  const sharedItems = shared.nodes.map(toNavigatorItem).sort(navigatorItemSort);
  const orphanItems = orphan.nodes.map(toNavigatorItem).sort(navigatorItemSort);

  return {triggers: [], shared: sharedItems, orphan: orphanItems};
};
