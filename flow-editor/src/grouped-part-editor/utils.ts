import * as immer from "immer";
import { PART_HEIGHT } from "./GroupedPartEditor";
import {
  Pos,
  InputPin,
  OutputPin,
  GroupedPart,
  PartInstance,
  PartDefRepo,
  PartDefinition,
  isExternalConnectionNode,
  isGroupedPart,
  getPartDef,
  PinType,
  partInstance,
  stickyInputPinConfig,
  queueInputPinConfig,
  isStickyInputPinConfig,
  InputMode,
  TRIGGER_PIN_ID,
  ERROR_PIN_ID,
  inlinePartInstance,
  ResolvedFlydeFlowDefinition,
  getPart,
} from "@flyde/core";
import {
  calcPinPosition,
  calcMainInputPosition,
  calcMainOutputPosition,
} from "./connection-view/calc-pin-position";
import { Size, intersectRect, Rect } from "../utils";
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
import { vSub, vAdd } from "../physics";
import { getLeafInstancesOfSelection } from "./part-graph-utils";
import { toastMsg } from "../toaster";

export const emptyObj = {}; // for immutability
export const emptyList = []; // for immutability

export const toggleStickyPin = (
  value: GroupedPart,
  insKey: string,
  pinId: string,
  forceValue?: boolean
) => {
  return immer.produce(value, (draft) => {
    const { instances } = draft;
    const instance = instances.find((ins) => ins.id === insKey);
    if (!instance) {
      throw new Error("blah");
    }
    const config = instance.inputConfig || {};
    const currConfig = config[pinId] || queueInputPinConfig();
    if (isStickyInputPinConfig(currConfig)) {
      config[pinId] = queueInputPinConfig();
    } else {
      config[pinId] = stickyInputPinConfig();
    }
    draft.instances = instances.map((itrIns) =>
      itrIns === instance ? { ...instance, inputConfig: config } : itrIns
    );
  });
};

export const findClosestPin = (
  part: GroupedPart,
  repo: PartDefRepo,
  mousePos: Pos,
  size: Size,
  boardPos: Pos,
  insId: string
) => {

  const rootInstance: PartInstance = partInstance(part.id, part.id);
  const mainInputsData = okeys(part.inputs).map((pinId) => {
    const pos = calcMainInputPosition(part, size, pinId, insId, "input", boardPos);
    return { id: pinId, type: "input", pos, ins: rootInstance };
  });

  const mainOutputsData = okeys(part.outputs).map((pinId) => {
    const pos = calcMainOutputPosition(part, size, pinId, insId, "output", boardPos);
    return { id: pinId, type: "output", pos, ins: rootInstance };
  });

  const instancesData = part.instances.reduce<any[]>((acc, ins) => {
    const part = getPartDef(ins, repo);

    const inputKeys = [...okeys(part.inputs), TRIGGER_PIN_ID];
    const outputKeys = [...okeys(part.outputs), ERROR_PIN_ID];

    const ips = inputKeys.map((id) => ({
      ins,
      type: "input",
      pos: calcPinPosition(insId, ins.id, id, "input", boardPos),
      id,
    }));
    const ops = outputKeys.map((id) => ({
      ins,
      type: "output",
      pos: calcPinPosition(insId, ins.id, id, "output", boardPos),
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
  const [, inputsRaw, outputsRaw] = (typeStr.match(/part\((.+)\|(.+)\)/) || []) as any;

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
  part: PartDefinition,
  offset: number = -1 * PART_HEIGHT * 1.5,
  lastMousePos: Pos
): PartInstance => {

  const ins = inlinePartInstance(`${part.id}-${randomInt(999)}`, part as any, {}, { x: 0, y: 0 });
  const width = calcPartWidth(ins, part);

  const { x, y } = lastMousePos;
  const pos = {
    x: x - width / 2,
    y: y + offset,
  };

  return { ...ins, pos };
};

export const createNewPartInstance = (
  partId: string,
  offset: number = -1 * PART_HEIGHT * 1.5,
  lastMousePos: Pos,
  repo: PartDefRepo
): PartInstance => {
  const part = getPartDef(partId, repo);

  if (!part) {
    throw new Error(`${partId} part not found in repo`);
  }

  const ins = partInstance(`${part.id}-${randomInt(999)}`, part.id, {}, { x: 0, y: 0 });
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

export const domToViewPort = (p: Pos, viewPort: ViewPort): Pos => {
  return {
    x: roundNumber(viewPort.pos.x + p.x / viewPort.zoom),
    y: roundNumber(viewPort.pos.y + p.y / viewPort.zoom),
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

export const center = (rect: Rect, vpSize: { w: number; h: number }, { zoom }: ViewPort): Pos => {
  const ecx = rect.x + rect.w / 2;
  const ecy = rect.y + rect.h / 2;
  const { w, h } = vpSize;
  return { x: ecx - w / zoom / 2, y: ecy - h / zoom / 2 };
};

export const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

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

export const animatePos = (p1: Pos, p2: Pos, duration: number, cb: (p: Pos) => void) => {
  const dis = distance(p1, p2);

  const start = Date.now();
  const normDuration = Math.sqrt(dis) * duration;

  if (dis === 0) {
    cb(p1);
    return;
  }

  const animate = () => {
    const now = Date.now();
    const pos = easeInOutPos(p1, p2, start, normDuration, now);
    if (now - start < normDuration) {
      cb(pos);
      requestAnimationFrame(animate);
    } else {
      cb(pos);
      // ugly hack to re-render connections
      setTimeout(() => {
        cb(pos);
      }, 10);
    }
  };

  requestAnimationFrame(animate);
};


export const calcCenter = ({ w, h, x, y }: Rect): Pos => {
  const mx = x + w / 2;
  const my = y + h / 2;
  return { x: mx, y: my };
};

export const middlePos = (p1: Pos, p2: Pos): Pos => {
  const x = (p1.x + p2.x) / 2;
  const y = (p1.y + p2.y) / 2;
  return { x, y };
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

export const calcPartsPositions = (part: GroupedPart, repo: PartDefRepo): Points[] => {
  const insParts = part.instances.map((curr) => {
    const w = calcPartWidth(curr, getPartDef(curr, repo));
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

// export const calcPartsCenter = (part: GroupedPart, repo: PartDefRepo): Pos => {
//   const positions = calcPartsPositions(part, repo);
//   return positions.reduce((acc, curr) => middlePos(acc, curr), positions[0] || { x: 0, y: 0 });
// };

export const getEffectivePartDimensions = (part: GroupedPart, repo: PartDefRepo) => {
  const positions = calcPartsPositions(part, repo);
  const firstPosition = positions[0] || { left: 0, right: 0, top: 0, bottom: 0 };

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

export const fitViewPortToPart = (part: GroupedPart, repo: PartDefRepo, vpSize: Size): ViewPort => {
  const { size, center } = getEffectivePartDimensions(part, repo);

  const horPadding = 0;
  const verPadding = 0;

  const width = size.width + horPadding;
  const height = size.height + verPadding;

  const widthFit = vpSize.width / width; // i.e 2 if viewPort is twice as large, 0.5 is viewPort is half
  const heightFit = vpSize.height / height;

  const fitToGoBy = Math.min(widthFit, heightFit);

  const zoomPaddingModifier = 1.15;
  const idealZoom = fitToGoBy / zoomPaddingModifier;

  const zoom = clamp(0.3, 1, idealZoom);

  const vpX = center.x - vpSize.width / 2 / zoom;
  const vpY = center.y - vpSize.height / 2 / zoom;

  return {
    zoom,
    pos: { x: vpX, y: vpY },
  };
};

export const isJsxValue = (val: any): boolean => {
  const isIt = (j: any) => isDefined(j.ref) && isDefined(j.type) && isDefined(j.props);
  try {
    const j = JSON.parse(val);
    return isIt(j) || (Array.isArray(j) && isIt(j[0]));
  } catch (e) {
    return false;
  }
};

export const dismantleGroup = (
  part: GroupedPart,
  instance: PartInstance,
  repo: PartDefRepo
) => {
  return immer.produce(part, (draft) => {
    const part = getPartDef(instance, repo);
    if (!isGroupedPart(part)) {
      throw new Error("impossible state");
    }
    toastMsg('TODO', "danger")
  //   const { instances: newInstances, connections: newConnections } = part;

  //   const instancesFound = draft.instances.filter((ins) => ins.partId === part.id);
  //   const instancesFoundIds = instancesFound.map((i) => i.id);

  //   draft.instances = draft.instances.filter((ins) => !instancesFound.includes(ins));

  //   draft.connections = draft.connections.filter(({ from, to }) => {
  //     return !instancesFoundIds.includes(from.insId) && !instancesFoundIds.includes(to.insId);
  //   });

  //   draft.instances.push(...newInstances);
  //   draft.connections.push(
  //     ...newConnections.filter(
  //       (conn) => !isExternalConnectionNode(conn.from) && !isExternalConnectionNode(conn.to)
  //     )
  //   );
  });
};

export const getInstancesInRect = (
  selectionBox: { from: Pos; to: Pos },
  repo: PartDefRepo,
  viewPort: ViewPort,
  instancesConnectToPins: any,
  instances: PartInstance[],
  boardPos: Pos
) => {
  const { from, to } = selectionBox;
  const realFrom = domToViewPort(vSub(from, boardPos), viewPort);
  const realTo = domToViewPort(vSub(to, boardPos), viewPort);
  const rect = getSelectionBoxRect(realFrom, realTo);
  const toSelect = instances
    .filter((ins) => {
      const { pos } = ins;
      const w = calcPartWidth(
        ins,
        getPartDef(ins, repo),
      );
      const rec2 = { ...pos, w, h: PART_HEIGHT };
      return intersectRect(rect, rec2) || intersectRect(rec2, rect);
    })
    .map((ins) => ins.id);

  return toSelect;
};

export const handleInstanceDrag = (
  value: GroupedPart,
  ins: PartInstance,
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

  return {newValue, newSelected};
};

export const calcMoveViewPort = (
  event: React.MouseEvent,
  lastMousePos: Pos,
  moveStart: Pos,
  viewPort: ViewPort
) => {
  const now = { x: event.pageX, y: event.pageY };
  const dx = lastMousePos.x - now.x;
  const dy = lastMousePos.y - now.y;
  const { x, y } = moveStart;
  return immer.produce(viewPort, (vp) => {
    vp.pos.x = x + (dx * 3) / vp.zoom;
    vp.pos.y = y + (dy * 3) / vp.zoom;
  });
};

export const handleIoPinRename = (part: GroupedPart, type: PinType, pinId: string) => {
  return immer.produce(part, (draft) => {
    const newPinId = prompt("New name?") || "na";
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
      delete draft.outputs[pinId];
    }
  });
};

export const handleChangePartInputType = (
  part: GroupedPart,
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

