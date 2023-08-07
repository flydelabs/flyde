import * as immer from "immer";
import cuid from "cuid";
import { PART_HEIGHT } from "./VisualPartEditor";
import {
  Pos,
  InputPin,
  OutputPin,
  VisualNode,
  NodeInstance,
  NodesDefCollection,
  NodeDefinition,
  isExternalConnectionNode,
  getPartDef,
  PinType,
  partInstance,
  stickyInputPinConfig,
  queueInputPinConfig,
  isStickyInputPinConfig,
  InputMode,
  inlinePartInstance,
  staticInputPinConfig,
  intersectRect,
  Rect,
  calcCenter,
  fullInsIdPath,
  InputPinConfig,
} from "@flyde/core";
import { calcPinPosition } from "./connection-view/calc-pin-position";
import { Size } from "../utils";
import {
  isOptionalType,
  randomInt,
  okeys,
  OMap,
  entries,
  fromEntries,
  isDefined,
} from "@flyde/core";
import { calcPartWidth } from "./instance-view/utils";

import { calcPartIoWidth as calcIoPartWidth } from "./part-io-view/utils";
import { vSub, vAdd, vMul, vDiv } from "../physics";
import { getLeafInstancesOfSelection } from "./part-graph-utils";
import { getVisibleInputs, getVisibleOutputs } from "./instance-view";

export const emptyObj = {}; // for immutability
export const emptyList = []; // for immutability

export function getInstancePinConfig(
  part: VisualNode,
  insId: string,
  pinId: string
): InputPinConfig {
  const ins = part.instances.find((ins) => ins.id === insId);
  if (!ins) {
    throw new Error(`Instance ${insId} not found`);
  }
  const config = ins.inputConfig || emptyObj;
  return config[pinId] ?? queueInputPinConfig();
}

export const changePinConfig = (
  value: VisualNode,
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
  part: VisualNode,
  resolvedParts: NodesDefCollection,
  mousePos: Pos,
  boardPos: Pos,
  currentInsId: string,
  ancestorsInsIds: string,
  viewPort: ViewPort
) => {
  const rootInstance: NodeInstance = partInstance(part.id, part.id);
  const mainInputsData = okeys(part.inputs).map((pinId) => {
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

  const mainOutputsData = okeys(part.outputs).map((pinId) => {
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

  const instancesData = part.instances.reduce<any[]>((acc, ins) => {
    const insPart = getPartDef(ins, resolvedParts);

    const visibleInputs = getVisibleInputs(ins, insPart, part.connections);
    const visibleOutputs = getVisibleOutputs(ins, insPart, part.connections);

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

export const parsePromptValue = (raw: string | null) => {
  if (raw === null) {
    return;
  }
  const maybeNum = parseInt(raw, 10);
  let value: any = raw;
  // eslint-disable-next-line eqeqeq
  if (maybeNum.toString() == raw && !isNaN(maybeNum)) {
    value = maybeNum;
  }
  return value;
};

export const parseInputOutputTypes = (
  typeStr: string
): { inputs: OMap<InputPin>; outputs: OMap<OutputPin> } => {
  const [, inputsRaw, outputsRaw] = (typeStr.match(/part\((.+)\|(.+)\)/) ||
    []) as any;

  const inputsEntries = entries(JSON.parse(inputsRaw)).map(([key, type]) => {
    const optional = isOptionalType(key);

    const val = {
      type,
      optional,
    };
    return [key.replace(/\?$/, ""), val];
  });
  const outputsEntries = entries(JSON.parse(outputsRaw)).map(([key, type]) => {
    const optional = isOptionalType(key);

    const val = {
      type,
      optional,
    };
    return [key.replace(/\?$/, ""), val];
  });

  return {
    inputs: fromEntries(inputsEntries as any),
    outputs: fromEntries(outputsEntries as any),
  };
};

export const createNewInlinePartInstance = (
  part: NodeDefinition,
  offset: number = -1 * PART_HEIGHT * 1.5,
  lastMousePos: Pos
): NodeInstance => {
  const ins = inlinePartInstance(
    `${part.id}-${randomInt(999)}`,
    part as any,
    {},
    { x: 0, y: 0 }
  );
  const width = calcPartWidth(ins, part);

  const { x, y } = lastMousePos;
  const pos = {
    x: x - width / 2,
    y: y + offset,
  };

  return { ...ins, pos };
};

export const createNewPartInstance = (
  partIdOrPart: string | NodeDefinition,
  offset: number = -1 * PART_HEIGHT * 1.5,
  lastMousePos: Pos,
  resolvedParts: NodesDefCollection
): NodeInstance => {
  const part =
    typeof partIdOrPart === "string"
      ? getPartDef(partIdOrPart, resolvedParts)
      : partIdOrPart;

  if (!part) {
    throw new Error(`${partIdOrPart} part not found in resolvedParts`);
  }

  const inputsConfig = entries(part.inputs).reduce((acc, [k, v]) => {
    // if (v.)
    if (v.defaultValue) {
      acc[k] = staticInputPinConfig(v.defaultValue);
    }
    return acc;
  }, {});

  const ins = partInstance(cuid(), part.id, inputsConfig, { x: 0, y: 0 });
  const width = calcPartWidth(ins, part);

  const { x, y } = lastMousePos;
  const pos = {
    x: x - width / 2,
    y: y + offset,
  };

  return { ...ins, pos };
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

export const calcPartsPositions = (
  part: VisualNode,
  resolvedParts: NodesDefCollection
): Points[] => {
  const insParts = part.instances.map((curr) => {
    const w = calcPartWidth(curr, getPartDef(curr, resolvedParts));
    const h = PART_HEIGHT;
    return calcPoints(w, h, curr.pos, curr.id);
  });

  const inputsCenter = okeys(part.inputs).map((curr) => {
    const w = calcIoPartWidth(curr);
    const h = PART_HEIGHT;
    const pos = part.inputsPosition[curr] || { x: 0, y: 0 };
    return calcPoints(w, h, pos, "input_" + curr);
  });

  const outputsCenter = okeys(part.outputs).map((curr) => {
    const w = calcIoPartWidth(curr);
    const h = PART_HEIGHT;
    const pos = part.outputsPosition[curr] || { x: 0, y: 0 };
    return calcPoints(w, h, pos, "output" + curr);
  });

  return [...insParts, ...inputsCenter, ...outputsCenter];
};

// export const calcPartsCenter = (part: VisualNode, resolvedParts: NodesDefCollection): Pos => {
//   const positions = calcPartsPositions(part, resolvedParts);
//   return positions.reduce((acc, curr) => middlePos(acc, curr), positions[0] || { x: 0, y: 0 });
// };

export const getEffectivePartDimensions = (
  part: VisualNode,
  resolvedParts: NodesDefCollection
) => {
  const positions = calcPartsPositions(part, resolvedParts);
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
const FIT_VIEWPORT_MAX_ZOOM = 1.2;

export const fitViewPortToPart = (
  part: VisualNode,
  resolvedParts: NodesDefCollection,
  vpSize: Size,
  padding: [number, number] = [20, 150]
): ViewPort => {
  const { size, center } = getEffectivePartDimensions(part, resolvedParts);

  const horPadding = padding[0];
  const verPadding = padding[1];

  const width = size.width + horPadding;
  const height = size.height + verPadding;

  const widthFit = vpSize.width / width; // i.e 2 if viewPort is twice as large, 0.5 is viewPort is half
  const heightFit = vpSize.height / height;

  const fitToGoBy = Math.min(widthFit, heightFit);

  const zoomPaddingModifier = 1.15;
  const idealZoom = fitToGoBy / zoomPaddingModifier;

  const zoom = clamp(FIT_VIEWPORT_MIN_ZOOM, FIT_VIEWPORT_MAX_ZOOM, idealZoom);

  const vpX = center.x - vpSize.width / 2 / zoom;
  const vpY = center.y - vpSize.height / 2 / zoom + 40; // TODO - find out why "+40" is needed

  return {
    zoom,
    pos: { x: vpX, y: vpY },
  };
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
  resolvedParts: NodesDefCollection,
  viewPort: ViewPort,
  instancesConnectToPins: any,
  instances: NodeInstance[],
  boardPos: Pos,
  parentVp: ViewPort
) => {
  const { from, to } = selectionBox;

  const rect = getSelectionBoxRect(from, to);
  const toSelect = instances
    .filter((ins) => {
      const { pos } = ins;
      const w =
        calcPartWidth(ins, getPartDef(ins, resolvedParts)) *
        viewPort.zoom *
        parentVp.zoom;
      const rec2 = {
        ...pos,
        w,
        h: PART_HEIGHT * viewPort.zoom * parentVp.zoom,
      };
      console.log(ins.id, rec2, "main", rect);

      return intersectRect(rect, rec2) || intersectRect(rec2, rect);
    })
    .map((ins) => ins.id);

  return toSelect;
};

export const handleInstanceDrag = (
  value: VisualNode,
  ins: NodeInstance,
  pos: Pos,
  event: any,
  selected: string[],
  draggingId?: string
) => {
  event.preventDefault();
  event.stopPropagation();

  const delta = vSub(pos, ins.pos);

  let newSelected;
  const newValue = immer.produce(value, (draft) => {
    const foundIns = draft.instances.find((itrIns) => itrIns.id === ins.id);

    if (!foundIns) {
      throw new Error("impossible state dragging instance that does not exist");
    }

    if (!event.shiftKey && draggingId) {
      newSelected = [draggingId];
    }

    const otherInstances = draft.instances.filter(
      (ins) => selected.includes(ins.id) && ins !== foundIns
    );

    const draggedInstances = [foundIns, ...otherInstances];

    const leaves = getLeafInstancesOfSelection(
      draggedInstances,
      draft.instances,
      draft.connections
    );

    [...otherInstances, ...leaves].forEach((ins) => {
      ins.pos = vAdd(ins.pos, delta);
    });

    foundIns.pos = pos;
    if (!event.shiftKey && draggingId) {
      newSelected = [draggingId];
    }
  });

  return { newValue, newSelected };
};

export const handleIoPinRename = (
  part: VisualNode,
  type: PinType,
  pinId: string,
  newPinId: string
) => {
  return immer.produce(part, (draft) => {
    if (type === "input") {
      draft.inputs[newPinId] = draft.inputs[pinId];
      draft.inputsPosition[newPinId] = draft.inputsPosition[pinId];
      delete draft.inputs[pinId];
      draft.connections = draft.connections.map((conn) => {
        return isExternalConnectionNode(conn.from) && conn.from.pinId === pinId
          ? { ...conn, from: { ...conn.from, pinId: newPinId } }
          : conn;
      });
    } else {
      draft.outputs[newPinId] = draft.outputs[pinId];
      draft.outputsPosition[newPinId] = draft.outputsPosition[pinId];
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

export const handleChangePartInputType = (
  part: VisualNode,
  pinId: string,
  mode: InputMode
) => {
  return immer.produce(part, (draft) => {
    const input = draft.inputs[pinId];
    if (!input) {
      throw new Error("Wat");
    }
    input.mode = mode;
  });
};
