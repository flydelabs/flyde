import * as React from "react";
import classNames from "classnames";
import {
  GroupedPart,
  Pos,
  PartDefRepo,
  getPartDef,
  PartInstance,
  ConnectionNode,
  isInternalConnectionNode,
  isExternalConnectionNode,
  TRIGGER_PIN_ID,
} from "@flyde/core";
import {
  calcPinPosition,
  calcMainInputPosition,
  calcMainOutputPosition,
} from "./calc-pin-position";
import { Size } from "../../utils";
// ;
import { calcInstancePosition } from "../instance-view/utils";
import { calcBezierPath } from "./bezier";

export interface ConnectionViewProps {
  from: ConnectionNode;
  to: ConnectionNode;
  instances: PartInstance[];
  repo: PartDefRepo;
  part: GroupedPart;
  parentInsId: string;
  onDblClick: () => void;
  size: Size;
  boardPos: Pos;
  viewPort: { pos: Pos; zoom: number };
  future?: "addition" | "removal";
}

const calcStartPos = (props: ConnectionViewProps): Pos => {
  const { from, part, size, boardPos, parentInsId } = props;

  if (isExternalConnectionNode(from)) {
    return calcMainInputPosition(part, size, from.pinId, parentInsId, "input", boardPos);
  } else {
    return calcPinPosition(parentInsId, from.insId, from.pinId, "output", boardPos);
  }
};

const calcTargetPos = (props: ConnectionViewProps): Pos => {
  const { to, part, size, boardPos, parentInsId } = props;

  if (isExternalConnectionNode(to)) {
    return calcMainOutputPosition(part, size, to.pinId, parentInsId, "output", boardPos);
  } else {
    return calcPinPosition(parentInsId, to.insId, to.pinId, "input", boardPos);
  }
};

export const ConnectionView: React.FC<ConnectionViewProps> = (props) => {
  const { from, onDblClick, part, viewPort, repo, future, instances, to } = props;
  const [renderTrigger, setRenderTrigger] = React.useState(0);

  const fromInstance = isInternalConnectionNode(from) && instances.find((i) => i.id === from.insId);

  if (!fromInstance && isInternalConnectionNode(from)) {
    throw new Error(`impossible state  - "from instance id - [${from.insId}] does not exist"`);
  }

  const fromPart =
    isInternalConnectionNode(from) && fromInstance ? getPartDef(fromInstance, repo) : part;

  const sourcePin = fromPart.outputs[from.pinId];
  const delayed = sourcePin && sourcePin.delayed;

  const { x: x1, y: y1 } = calcStartPos(props);
  const { x: x2, y: y2 } = calcTargetPos(props);

  React.useEffect(() => {
    let t: number = 0;
    // re-render 10 times and then stop
    // this is a very ugly hack to make connections render smoothly
    // but for some reason, if this is always on (As in no limit), when the playground
    // is scrolled, connections are rendered wrong
    const rerender = (count: number) => {
      return requestAnimationFrame(() => {
        setRenderTrigger((r) => r + 1);
        if (count) {
          t = rerender(count - 1);
        }
        // console.log(x1, y1, x2, y2);
      });
    };

    t = rerender(20);

    return () => {
      cancelAnimationFrame(t);
    };
  }, [x1, y1, x2, y2]);

  const cm = classNames("connection", { delayed }, future ? `future-${future}` : undefined);

  const bob = calcBezierPath({
    sourceX: x1,
    sourceY: y1,
    targetX: x2,
    targetY: y2,
    curvature: 0.15,
  });

  return (
    <span
      className={cm}
      style={{ opacity: viewPort.zoom }}
      data-from-id={`${from.insId}.${from.pinId}`}
      data-to-id={`${to.insId}.${to.pinId}`}
    >
      <svg>
        {/* <polyline onDoubleClick={onDblClick} points={`${x1},${y1} ${x2},${y2}`}></polyline> */}
        <path d={bob} />
      </svg>
    </span>
  );
};
