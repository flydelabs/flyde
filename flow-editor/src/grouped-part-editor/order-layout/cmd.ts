import { PART_HEIGHT } from "../GroupedPartEditor";
import {
  okeys,
  isExternalConnectionNode,
  entries,
  GroupedPart,
  PartDefRepo,
  getPartDef,
  ResolvedFlydeFlowDefinition,
} from "@flyde/core";
import { orderLayout, LayoutData } from ".";
import produce from "immer";
import { calcPartIoWidth } from "../part-io-view/utils";
import { size } from "../../physics";
import { calcPartWidth } from "../instance-view/utils";

export const layoutToInstances = (ld: LayoutData, part: GroupedPart): GroupedPart => {
  return produce(part, (draft) => {
    entries(ld.nodes).forEach(([id, node]) => {
      if (id.startsWith("ins-")) {
        const insId = id.replace("ins-", "");
        const ins = draft.instances.find((i) => i.id === insId);
        if (ins) {
          ins.pos = node.p;
        } else {
          console.warn("WAT");
        }
      }

      if (id.startsWith("part-input-")) {
        const pinId = id.replace("part-input-", "");
        draft.inputsPosition[pinId] = node.p;
      }

      if (id.startsWith("part-output-")) {
        const pinId = id.replace("part-output-", "");
        draft.outputsPosition[pinId] = node.p;
      }
    });
  });
};

export const orderGroupedPart = (
  part: GroupedPart,
  repo: PartDefRepo,
  itrs: number,
  onStep?: (val: GroupedPart, idx: number) => void
) => {
  const { instances, connections } = part;
  const insNodes = instances.reduce((prev, curr) => {
    const s = size(calcPartWidth(curr, getPartDef(curr, repo)), PART_HEIGHT);
    return {
      ...prev,
      [`ins-${curr.id}`]: { p: curr.pos, s },
    };
  }, {});

  const partInputNodes = okeys(part.inputsPosition).reduce((prev, curr) => {
    const p = part.inputsPosition[curr];
    const s = size(calcPartIoWidth(curr), PART_HEIGHT);
    return { ...prev, [`part-input-${curr}`]: { p, s } };
  }, {});

  const partOutputNodes = okeys(part.outputsPosition).reduce((prev, curr) => {
    const p = part.outputsPosition[curr];
    const s = size(calcPartIoWidth(curr), PART_HEIGHT);
    return { ...prev, [`part-output-${curr}`]: { p, s } };
  }, {});

  const nodes = { ...insNodes, ...partInputNodes, ...partOutputNodes };

  const edges = connections.map((data) => {
    const from = !isExternalConnectionNode(data.from)
      ? `ins-${data.from.insId}`
      : `part-input-${data.from.pinId}`;
    const to = !isExternalConnectionNode(data.to)
      ? `ins-${data.to.insId}`
      : `part-output-${data.to.pinId}`;

    return [from, to] as [string, string];
  });

  const result = orderLayout({ nodes, edges }, itrs, (ld, idx) => {
    if (onStep) {
      onStep(layoutToInstances(ld, part), idx);
    }
  });

  const newValue = layoutToInstances(result, part);

  return newValue;
};
