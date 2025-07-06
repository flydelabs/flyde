import {
  ConnectionNode,
  fullInsIdPath,
  isExternalConnectionNode,
  PinType,
  Pos,
} from "@flyde/core";
import { logger, ViewPort } from "../..";
import { getPinDomHandleId } from "../dom-ids";

const elemPos = (elem: Element, boardPos: Pos): Pos => {
  const { x, y, width, height } = elem.getBoundingClientRect();

  const mx = x + width / 2;
  const my = y + height / 2;

  return {
    x: mx - boardPos.x,
    y: my - boardPos.y,
  };
};

export const unfoundPinPos = { x: 99999, y: 99999 };

export function calcPinPosition(params: {
  insId: string;
  ancestorsInsIds?: string;
  pinId: string;
  pinType: PinType;
  isMain: boolean;
  boardPos: Pos;
  viewPort: ViewPort;
}) {
  const fullParams = {
    fullInsIdPath: fullInsIdPath(params.insId, params.ancestorsInsIds),
    pinId: params.pinId,
    pinType: params.pinType,
    isMain: params.isMain,
  };
  const domId = getPinDomHandleId(fullParams);
  const elem = document.getElementById(domId);
  if (!elem) {
    logger("calcPinPosition: cannot find element", { domId });
    return unfoundPinPos;
  }
  return elemPos(elem, params.boardPos);
}

export const calcStartPos = (props: {
  connectionNode: ConnectionNode;
  boardPos: Pos;
  ancestorsInsIds?: string;
  viewPort: ViewPort;
  currentInsId: string;
}): Pos => {
  const { connectionNode, boardPos, ancestorsInsIds, viewPort, currentInsId } =
    props;

  if (isExternalConnectionNode(connectionNode)) {
    return calcPinPosition({
      pinId: connectionNode.pinId,
      insId: currentInsId,
      ancestorsInsIds: ancestorsInsIds,
      isMain: true,
      pinType: "input",
      boardPos,
      viewPort,
    });
  } else {
    return calcPinPosition({
      pinId: connectionNode.pinId,
      insId: connectionNode.insId,
      ancestorsInsIds: fullInsIdPath(currentInsId, ancestorsInsIds),
      isMain: false,
      pinType: "output",
      boardPos,
      viewPort,
    });
  }
};

export const calcTargetPos = (props: {
  connectionNode: ConnectionNode;
  boardPos: Pos;
  ancestorsInsIds?: string;
  viewPort: ViewPort;
  currentInsId: string;
}): Pos => {
  const { connectionNode, boardPos, ancestorsInsIds, viewPort, currentInsId } =
    props;

  if (isExternalConnectionNode(connectionNode)) {
    return calcPinPosition({
      pinId: connectionNode.pinId,
      insId: currentInsId,
      ancestorsInsIds: ancestorsInsIds,
      isMain: true,
      pinType: "output",
      boardPos,
      viewPort,
    });
  } else {
    return calcPinPosition({
      pinId: connectionNode.pinId,
      insId: connectionNode.insId,
      ancestorsInsIds: fullInsIdPath(currentInsId, ancestorsInsIds),
      isMain: false,
      pinType: "input",
      boardPos,
      viewPort,
    });
  }
};
