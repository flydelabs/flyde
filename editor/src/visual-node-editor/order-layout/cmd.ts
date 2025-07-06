import { NODE_HEIGHT } from "../VisualNodeEditor";
import {
  keys,
  isExternalConnectionNode,
  entries,
  VisualNode,
  EditorVisualNode,
} from "@flyde/core";
import { orderLayout, LayoutData } from ".";
import produce from "immer";
import { calcNodeIoWidth } from "../node-io-view/utils";
import { size } from "../../physics";
import { calcNodeWidth } from "../instance-view/utils";

export const layoutToInstances = (
  ld: LayoutData,
  node: VisualNode
): VisualNode => {
  return produce(node, (draft) => {
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

      if (id.startsWith("node-input-")) {
        const pinId = id.replace("node-input-", "");
        draft.inputsPosition[pinId] = node.p;
      }

      if (id.startsWith("node-output-")) {
        const pinId = id.replace("node-output-", "");
        draft.outputsPosition[pinId] = node.p;
      }
    });
  });
};

export const orderVisualNode = (
  node: EditorVisualNode,
  itrs: number,
  onStep?: (val: VisualNode, idx: number) => void
) => {
  const { instances, connections } = node;
  const insNodes = instances.reduce((prev, curr) => {
    const s = size(calcNodeWidth(curr), NODE_HEIGHT);
    return {
      ...prev,
      [`ins-${curr.id}`]: { p: curr.pos, s },
    };
  }, {});

  const nodeInputNodes = keys(node.inputsPosition).reduce((prev, curr) => {
    const p = node.inputsPosition[curr];
    const s = size(calcNodeIoWidth(curr), NODE_HEIGHT);
    return { ...prev, [`node-input-${curr}`]: { p, s } };
  }, {});

  const nodeOutputNodes = keys(node.outputsPosition).reduce((prev, curr) => {
    const p = node.outputsPosition[curr];
    const s = size(calcNodeIoWidth(curr), NODE_HEIGHT);
    return { ...prev, [`node-output-${curr}`]: { p, s } };
  }, {});

  const nodes = { ...insNodes, ...nodeInputNodes, ...nodeOutputNodes };

  const edges = connections.map((data) => {
    const from = !isExternalConnectionNode(data.from)
      ? `ins-${data.from.insId}`
      : `node-input-${data.from.pinId}`;
    const to = !isExternalConnectionNode(data.to)
      ? `ins-${data.to.insId}`
      : `node-output-${data.to.pinId}`;

    return [from, to] as [string, string];
  });

  const result = orderLayout({ nodes, edges }, itrs, (ld, idx) => {
    if (onStep) {
      onStep(layoutToInstances(ld, node), idx);
    }
  });

  const newValue = layoutToInstances(result, node);

  return newValue;
};
