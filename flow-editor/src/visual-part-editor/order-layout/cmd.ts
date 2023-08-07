import { PART_HEIGHT } from "../VisualNodeEditor";
import {
  okeys,
  isExternalConnectionNode,
  entries,
  VisualNode,
  NodesDefCollection,
  getNodeDef,
  ResolvedFlydeFlowDefinition,
} from "@flyde/core";
import { orderLayout, LayoutData } from ".";
import produce from "immer";
import { calcNodeIoWidth } from "../part-io-view/utils";
import { size } from "../../physics";
import { calcNodeWidth } from "../instance-view/utils";

export const layoutToInstances = (
  ld: LayoutData,
  part: VisualNode
): VisualNode => {
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

export const orderVisualPart = (
  part: VisualNode,
  resolvedNodes: NodesDefCollection,
  itrs: number,
  onStep?: (val: VisualNode, idx: number) => void
) => {
  const { instances, connections } = part;
  const insNodes = instances.reduce((prev, curr) => {
    const s = size(
      calcNodeWidth(curr, getNodeDef(curr, resolvedNodes)),
      PART_HEIGHT
    );
    return {
      ...prev,
      [`ins-${curr.id}`]: { p: curr.pos, s },
    };
  }, {});

  const nodeInputNodes = okeys(part.inputsPosition).reduce((prev, curr) => {
    const p = part.inputsPosition[curr];
    const s = size(calcNodeIoWidth(curr), PART_HEIGHT);
    return { ...prev, [`part-input-${curr}`]: { p, s } };
  }, {});

  const nodeOutputNodes = okeys(part.outputsPosition).reduce((prev, curr) => {
    const p = part.outputsPosition[curr];
    const s = size(calcNodeIoWidth(curr), PART_HEIGHT);
    return { ...prev, [`part-output-${curr}`]: { p, s } };
  }, {});

  const nodes = { ...insNodes, ...nodeInputNodes, ...nodeOutputNodes };

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
