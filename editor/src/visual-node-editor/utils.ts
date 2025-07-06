import * as immer from "immer";

import { NODE_HEIGHT } from "./VisualNodeEditor";
import {
  Pos,
  NodeInstance,
  isExternalConnectionNode,
  PinType,
  nodeInstance,
  queueInputPinConfig,
  InputMode,
  intersectRect,
  Rect,
  calcCenter,
  fullInsIdPath,
  InputPinConfig,
  createInsId,
  EditorVisualNode,
  EditorNodeInstance,
  ImportableEditorNode,
  visualNodeInstance,
} from "@flyde/core";
import { calcPinPosition } from "./connection-view/calc-pin-position";
import { Size } from "../utils";
import { keys, isDefined } from "@flyde/core";
import { calcNodeWidth } from "./instance-view/utils";

import { calcNodeIoWidth as calcIoNodeWidth } from "./node-io-view/utils";
import { vSub, vAdd, vMul, vDiv } from "../physics";
import { getVisibleInputs, getVisibleOutputs } from "./instance-view";
import { ConnectionData } from "@flyde/core";

export const emptyObj = {}; // for immutability
export const emptyList = []; // for immutability

export function getInstancePinConfig(
  node: EditorVisualNode,
  insId: string,
  pinId: string
): InputPinConfig {
  const ins = node.instances.find((ins) => ins.id === insId);
  if (!ins) {
    throw new Error(`Instance ${insId} not found`);
  }
  const config = ins.inputConfig || emptyObj;
  return config[pinId] ?? queueInputPinConfig();
}

export const changePinConfig = (
  value: EditorVisualNode,
  insKey: string,
  pinId: string,
  newConfig: InputPinConfig
) => {
  return immer.produce(value, (draft) => {
    const { instances } = draft;
    const instance = instances.find((ins) => ins.id === insKey);
    if (!instance) {
      throw new Error("blah");
    }
    const config = instance.inputConfig ?? {};
    config[pinId] = newConfig;

    draft.instances = instances.map((itrIns) =>
      itrIns === instance ? { ...instance, inputConfig: config } : itrIns
    );
  });
};

export const findClosestPin = (
  node: EditorVisualNode,
  mousePos: Pos,
  boardPos: Pos,
  currentInsId: string,
  ancestorsInsIds: string,
  viewPort: ViewPort
) => {
  const rootInstance: NodeInstance = nodeInstance(node.id, node.id, {} as any, {
    x: 0,
    y: 0,
  });
  const mainInputsData = keys(node.inputs).map((pinId) => {
    const pos = calcPinPosition({
      insId: currentInsId,
      ancestorsInsIds,
      pinId,
      pinType: "input",
      boardPos,
      viewPort,
      isMain: true,
    });
    return { id: pinId, type: "input", pos, ins: rootInstance };
  });

  const mainOutputsData = keys(node.outputs).map((pinId) => {
    const pos = calcPinPosition({
      insId: currentInsId,
      ancestorsInsIds,
      pinId,
      pinType: "output",
      boardPos,
      viewPort,
      isMain: true,
    });
    return { id: pinId, type: "output", pos, ins: rootInstance };
  });

  const instancesData = node.instances.reduce<any[]>((acc, ins) => {
    const visibleInputs = getVisibleInputs(ins, ins.node, node.connections);
    const visibleOutputs = getVisibleOutputs(ins, ins.node, node.connections);

    const ips = visibleInputs.map((id) => ({
      ins,
      type: "input",
      pos: calcPinPosition({
        insId: ins.id,
        ancestorsInsIds: fullInsIdPath(currentInsId, ancestorsInsIds),
        pinId: id,
        pinType: "input",
        boardPos,
        viewPort,
        isMain: false,
      }),
      id,
    }));
    const ops = visibleOutputs.map((id) => ({
      ins,
      type: "output",
      pos: calcPinPosition({
        insId: ins.id,
        ancestorsInsIds: fullInsIdPath(currentInsId, ancestorsInsIds),
        pinId: id,
        pinType: "output",
        boardPos,
        viewPort,
        isMain: false,
      }),
      id,
    }));

    return [...acc, ...ips, ...ops];
  }, []);

  const all = [...mainInputsData, ...instancesData, ...mainOutputsData];

  let closest = { dis: 100000, item: all[0] };

  all.forEach((item) => {
    const dx = item.pos.x - mousePos.x;
    const dy = item.pos.y - mousePos.y;

    const dis = Math.sqrt(dx * dx + dy * dy);

    if (dis < closest.dis) {
      closest.dis = dis;
      closest.item = item;
    }
  });

  return closest.item;
};

export const getSelectionBoxRect = (from: Pos, to: Pos) => {
  const mnx = Math.min(from.x, to.x);
  const mny = Math.min(from.y, to.y);
  const mxx = Math.max(from.x, to.x);
  const mxy = Math.max(from.y, to.y);
  const w = mxx - mnx;
  const h = mxy - mny;
  return { x: mnx, y: mny, w, h };
};

export const createNewNodeInstance = (
  importableNode: ImportableEditorNode,
  offset: number = -1 * NODE_HEIGHT * 1.5,
  lastMousePos: Pos
): EditorNodeInstance => {
  // TODO - handle visual node addition

  const insId = createInsId(importableNode);

  const ins =
    importableNode.type === "visual"
      ? visualNodeInstance(insId, importableNode.id, importableNode.source)
      : nodeInstance(
        insId,
        importableNode.id,
        importableNode.source,
        importableNode.config,
        {},
        {
          x: 0,
          y: 0,
        }
      );

  const width = 300; // TODO - calc proper width

  const { x, y } = lastMousePos;
  const pos = {
    x: x - width / 2,
    y: y + offset,
  };

  return { ...ins, pos, node: importableNode.editorNode };
};

export type ViewPort = { pos: Pos; zoom: number };
export const roundNumber = (v: number) => Math.round(v * 100) / 100;

export const domToViewPort = (
  p: Pos,
  viewPort: ViewPort,
  parentVp: ViewPort
): Pos => {
  return {
    x: roundNumber(viewPort.pos.x + p.x / viewPort.zoom / parentVp.zoom),
    y: roundNumber(viewPort.pos.y + p.y / viewPort.zoom / parentVp.zoom),
  };
};

export const clamp = (min: number, max: number, v: number) => {
  return Math.max(min, Math.min(max, v));
};

export const distance = (p1: Pos, p2: Pos) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const center = (
  rect: Rect,
  vpSize: { w: number; h: number },
  { zoom }: ViewPort
): Pos => {
  const ecx = rect.x + rect.w / 2;
  const ecy = rect.y + rect.h / 2;
  const { w, h } = vpSize;
  return { x: ecx - w / zoom / 2, y: ecy - h / zoom / 2 };
};

export const easeInOutQuad = (t: number) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

export const easeInOutPos = (
  p1: Pos,
  p2: Pos,
  start: number,
  duration: number,
  now: number
): Pos => {
  const t = clamp(0, 1, (now - start) / duration);

  const m = easeInOutQuad(t);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return {
    x: p1.x + dx * m,
    y: p1.y + dy * m,
  };
};

export const easeInOutNum = (
  n1: number,
  n2: number,
  start: number,
  duration: number,
  now: number
): number => {
  const t = clamp(0, 1, (now - start) / duration);

  const m = easeInOutQuad(t);

  const d = n2 - n1;

  return n1 + d * m;
};

export const animateViewPort = (
  vp1: ViewPort,
  vp2: ViewPort,
  duration: number,
  cb: (vp: ViewPort) => void
) => {
  const dis = distance(vp1.pos, vp2.pos);

  const start = Date.now();
  const normDuration = duration;

  if (dis === 0) {
    cb(vp1);
    return;
  }

  const animate = () => {
    const now = Date.now();
    const pos = easeInOutPos(vp1.pos, vp2.pos, start, normDuration, now);
    const zoom = easeInOutNum(vp1.zoom, vp2.zoom, start, normDuration, now);
    if (now - start < normDuration) {
      cb({ pos, zoom });
      requestAnimationFrame(animate);
    } else {
      cb({ pos, zoom });
    }
  };

  requestAnimationFrame(animate);
};

export const calcSelectionBoxArea = (box: { from: Pos; to: Pos }): number => {
  const rect = getSelectionBoxRect(box.from, box.to);
  return rect.h * rect.w;
};

type Points = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  center: Pos;
  tag: string;
};

const calcPoints = (w: number, h: number, pos: Pos, tag: string): Points => {
  return {
    left: pos.x,
    right: pos.x + w,
    top: pos.y,
    bottom: pos.y + h,
    tag,
    center: calcCenter({ w, h, ...pos }),
  };
};

export const calcNodesPositions = (node: EditorVisualNode): Points[] => {
  const insNodes = node.instances.map((curr) => {
    const w = calcNodeWidth(curr);
    const h = NODE_HEIGHT;
    return calcPoints(w, h, curr.pos, curr.id);
  });

  const inputsCenter = keys(node.inputs).map((curr) => {
    const w = calcIoNodeWidth(curr);
    const h = NODE_HEIGHT;
    const pos = node.inputsPosition[curr] || { x: 0, y: 0 };
    return calcPoints(w, h, pos, "input_" + curr);
  });

  const outputsCenter = keys(node.outputs).map((curr) => {
    const w = calcIoNodeWidth(curr);
    const h = NODE_HEIGHT;
    const pos = node.outputsPosition[curr] || { x: 0, y: 0 };
    return calcPoints(w, h, pos, "output" + curr);
  });

  return [...insNodes, ...inputsCenter, ...outputsCenter];
};

export const getEffectiveNodeDimensions = (node: EditorVisualNode) => {
  const positions = calcNodesPositions(node);
  const firstPosition = positions[0] || {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };

  const leftMost = positions.reduce(
    (acc, curr) => (curr.left < acc ? curr.left : acc),
    firstPosition.left
  );
  const rightMost = positions.reduce(
    (acc, curr) => (curr.right > acc ? curr.right : acc),
    firstPosition.right
  );

  const topMost = positions.reduce(
    (acc, curr) => (curr.top < acc ? curr.top : acc),
    firstPosition.top
  );
  const bottomMost = positions.reduce(
    (acc, curr) => (curr.bottom > acc ? curr.bottom : acc),
    firstPosition.bottom
  );

  const width = rightMost - leftMost;
  const height = bottomMost - topMost;

  const size: Size = { width: width, height: height };
  const pos: Pos = { x: leftMost, y: topMost };

  const center = calcCenter({ w: width, h: height, ...pos });

  return { size, pos, center };
};

export const logicalPosToRenderedPos = (pos: Pos, vp: ViewPort) => {
  const diff = vSub(pos, vp.pos);
  return vMul(diff, vp.zoom);
};

export const renderedPosToLogicalPos = (renderedPos: Pos, vp: ViewPort) => {
  const bob = vDiv(renderedPos, vp.zoom);

  return vAdd(vp.pos, bob);
};

export const centerBoardPosOnTarget = (
  target: Pos,
  vpSize: Size,
  newZoom: number,
  prevVp: ViewPort
) => {
  const renderedTargetPos = logicalPosToRenderedPos(target, prevVp);

  const nextBoardPos = renderedPosToLogicalPos(renderedTargetPos, {
    ...prevVp,
    zoom: newZoom,
  });

  const deltaX =
    Math.max(target.x, nextBoardPos.x) - Math.min(target.x, nextBoardPos.x);
  const deltaY =
    Math.max(target.y, nextBoardPos.y) - Math.min(target.y, nextBoardPos.y);

  const newX =
    newZoom > prevVp.zoom ? prevVp.pos.x + deltaX : prevVp.pos.x - deltaX;
  const newY =
    newZoom > prevVp.zoom ? prevVp.pos.y + deltaY : prevVp.pos.y - deltaY;

  return {
    x: newX,
    y: newY,
  };
};

const FIT_VIEWPORT_MIN_ZOOM = 0.3;
const FIT_VIEWPORT_MAX_ZOOM = 1;

export const fitViewPortToRect = (
  rect: Rect,
  vpSize: Size,
  padding: [number, number] = [5, 50]
): ViewPort => {
  const horPadding = padding[0];
  const verPadding = padding[1];

  const width = rect.w + horPadding;
  const height = rect.h + verPadding;

  const widthFit = vpSize.width / width; // i.e 2 if viewPort is twice as large, 0.5 is viewPort is half
  const heightFit = vpSize.height / height;

  const fitToGoBy = Math.min(widthFit, heightFit);

  const zoomPaddingModifier = 1.15;
  const idealZoom = fitToGoBy / zoomPaddingModifier;

  const zoom = clamp(FIT_VIEWPORT_MIN_ZOOM, FIT_VIEWPORT_MAX_ZOOM, idealZoom);

  const vpX = rect.x - vpSize.width / 2 / zoom;
  const vpY = rect.y - vpSize.height / 2 / zoom + 20; // TODO - find out why "+20" is needed

  return {
    zoom,
    pos: { x: vpX, y: vpY },
  };
};

export const fitViewPortToNode = (
  node: EditorVisualNode,
  vpSize: Size,
  padding: [number, number] = [20, 50]
): ViewPort => {
  const { size, center } = getEffectiveNodeDimensions(node);

  return fitViewPortToRect(
    {
      x: center.x,
      y: center.y,
      w: size.width,
      h: size.height,
    },
    vpSize,
    padding
  );
};

export const getMiddleOfViewPort = (vp: ViewPort, vpSize: Size) => {
  const renderedPos = {
    x: vpSize.width / 2,
    y: vpSize.height / 2,
  };

  return renderedPosToLogicalPos(renderedPos, vp);
};

export const isJsxValue = (val: any): boolean => {
  const isIt = (j: any) =>
    isDefined(j.ref) && isDefined(j.type) && isDefined(j.props);
  try {
    const j = JSON.parse(val);
    return isIt(j) || (Array.isArray(j) && isIt(j[0]));
  } catch (e) {
    return false;
  }
};

export const getInstancesInRect = (
  selectionBox: { from: Pos; to: Pos },
  viewPort: ViewPort,
  instances: NodeInstance[],
  parentVp: ViewPort,
  inputsPosition: Record<string, Pos | undefined> = {},
  outputsPosition: Record<string, Pos | undefined> = {}
) => {
  const { from, to } = selectionBox;

  const rect = getSelectionBoxRect(from, to);

  // Handle regular instances
  const selectedInstanceIds = instances
    .filter((ins) => {
      const { pos } = ins;
      const w = calcNodeWidth(ins) * viewPort.zoom * parentVp.zoom;
      const rec2 = {
        ...pos,
        w,
        h: NODE_HEIGHT * viewPort.zoom * parentVp.zoom,
      };

      return intersectRect(rect, rec2) || intersectRect(rec2, rect);
    })
    .map((ins) => ins.id);

  // Handle main inputs - use special "io_input_" prefix to identify them
  const selectedInputs = Object.entries(inputsPosition)
    .filter(([_, pos]) => {
      if (!pos) return false;
      const rec2 = {
        ...pos,
        w: calcIoNodeWidth('input') * viewPort.zoom * parentVp.zoom,
        h: NODE_HEIGHT * viewPort.zoom * parentVp.zoom,
      };
      return intersectRect(rect, rec2) || intersectRect(rec2, rect);
    })
    .map(([pinId, _]) => `io_input_${pinId}`);

  // Handle main outputs - use special "io_output_" prefix to identify them
  const selectedOutputs = Object.entries(outputsPosition)
    .filter(([_, pos]) => {
      if (!pos) return false;
      const rec2 = {
        ...pos,
        w: calcIoNodeWidth('output') * viewPort.zoom * parentVp.zoom,
        h: NODE_HEIGHT * viewPort.zoom * parentVp.zoom,
      };
      return intersectRect(rect, rec2) || intersectRect(rec2, rect);
    })
    .map(([pinId, _]) => `io_output_${pinId}`);

  return [...selectedInstanceIds, ...selectedInputs, ...selectedOutputs];
};

export const handleInstanceDrag = (
  node: EditorVisualNode,
  ins: NodeInstance,
  pos: Pos,
  event: any,
  selected: string[],
  draggingId?: string
) => {
  event.preventDefault();
  event.stopPropagation();

  const delta = vSub(pos, ins.pos);

  const newValue = immer.produce(node, (draft) => {
    const foundIns = draft.instances.find((itrIns) => itrIns.id === ins.id);

    if (!foundIns) {
      throw new Error("impossible state dragging instance that does not exist");
    }

    if (selected.includes(ins.id)) {
      const otherInstances = draft.instances.filter(
        (ins) => selected.includes(ins.id) && ins !== foundIns
      );

      otherInstances.forEach((ins) => {
        ins.pos = vAdd(ins.pos, delta);
      });
    }

    // Update selected IO pins
    selected.forEach(id => {
      // Handle input pins (format: io_input_pinId)
      if (id.startsWith('io_input_')) {
        const pinId = id.substring('io_input_'.length);
        if (draft.inputsPosition[pinId]) {
          draft.inputsPosition[pinId] = vAdd(draft.inputsPosition[pinId], delta);
        }
      }
      // Handle output pins (format: io_output_pinId)
      else if (id.startsWith('io_output_')) {
        const pinId = id.substring('io_output_'.length);
        if (draft.outputsPosition[pinId]) {
          draft.outputsPosition[pinId] = vAdd(draft.outputsPosition[pinId], delta);
        }
      }
    });

    foundIns.pos = pos;
  });

  return newValue;
};

export const handleIoPinRename = (
  node: EditorVisualNode,
  type: PinType,
  pinId: string,
  newPinId: string
) => {
  return immer.produce(node, (draft) => {
    if (type === "input") {
      if (!draft.inputs[pinId]) {
        throw new Error("Pin does not exist");
      }
      draft.inputs[newPinId] = draft.inputs[pinId];
      draft.inputsPosition[newPinId] = draft.inputsPosition[pinId]!;
      delete draft.inputs[pinId];
      draft.connections = draft.connections.map((conn) => {
        return isExternalConnectionNode(conn.from) && conn.from.pinId === pinId
          ? { ...conn, from: { ...conn.from, pinId: newPinId } }
          : conn;
      });
    } else {
      if (!draft.outputs[pinId]) {
        throw new Error("Pin does not exist");
      }
      draft.outputs[newPinId] = draft.outputs[pinId];
      draft.outputsPosition[newPinId] = draft.outputsPosition[pinId]!;
      draft.connections = draft.connections.map((conn) => {
        return isExternalConnectionNode(conn.to) && conn.to.pinId === pinId
          ? { ...conn, to: { ...conn.to, pinId: newPinId } }
          : conn;
      });

      draft.completionOutputs = (draft.completionOutputs || []).map((comp) => {
        const arr = comp.split("+"); // due to the r1+r1,r3 hack, see core tests
        return arr.map((pin) => (pin === pinId ? newPinId : pinId)).join("+");
      });
      delete draft.outputs[pinId];
    }
  });
};

export const handleChangeNodeInputType = (
  node: EditorVisualNode,
  pinId: string,
  mode: InputMode
) => {
  return immer.produce(node, (draft) => {
    const input = draft.inputs[pinId];
    if (!input) {
      throw new Error("Wat");
    }
    input.mode = mode;
  });
};
export const getConnectionId = (connectionData: ConnectionData) => {
  const { from, to } = connectionData;
  const { insId: fromInsId, pinId: fromPinId } = from;
  const { insId: toInsId, pinId: toPinId } = to;

  return `${fromInsId}${fromPinId}${toInsId}${toPinId}`;
};

export function isMac() {
  try {
    const platform = window.navigator.platform ?? "n/a";
    return /Mac|iPod|iPhone|iPad/.test(platform);
  } catch (e) {
    return false;
  }
}

export const isEventOnCurrentBoard = (
  e: KeyboardEvent | MouseEvent,
  nodeId: string
) => {
  const targetElem = e.target as Element;
  const closestBoard = targetElem.closest(".visual-node-editor");

  return closestBoard && closestBoard.getAttribute("data-id") === nodeId;
};
