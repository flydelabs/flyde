import { useState, useCallback, useRef } from "react";
import { NodeInstance, Pos, EditorVisualNode } from "@flyde/core";
import { findClosestPin, domToViewPort } from "./utils";
import { ViewPort } from "./utils";

export interface ClosestPinData {
  ins: NodeInstance;
  pin: string;
  type: "input" | "output";
}

export function useClosestPinAndMousePos(
  node: EditorVisualNode,
  currentInsId: string,
  ancestorsInsIds: string | undefined,
  viewPort: ViewPort,
  boardPos: Pos,
  parentViewport: ViewPort
) {
  const [closestPin, setClosestPin] = useState<ClosestPinData>();
  const lastMousePos = useRef<Pos>({ x: 400, y: 400 });

  const updateClosestPinAndMousePos = useCallback(
    (e: React.MouseEvent) => {
      const eventPos = { x: e.clientX, y: e.clientY };
      const normalizedPos = {
        x: eventPos.x - boardPos.x,
        y: eventPos.y - boardPos.y,
      };
      const posInBoard = domToViewPort(normalizedPos, viewPort, parentViewport);

      const closest = findClosestPin(
        node,
        normalizedPos,
        boardPos,
        currentInsId,
        ancestorsInsIds ?? "",
        viewPort
      );

      if (closest) {
        const isNewClosest =
          !closestPin ||
          closestPin.ins !== closest.ins ||
          (closestPin.ins === closest.ins && closestPin.pin !== closest.id);
        if (isNewClosest) {
          setClosestPin({
            ins: closest.ins,
            type: closest.type,
            pin: closest.id,
          });
        }
      } else {
        setClosestPin(undefined);
      }

      lastMousePos.current = posInBoard;
    },
    [
      node,
      boardPos,
      currentInsId,
      ancestorsInsIds,
      viewPort,
      parentViewport,
      closestPin,
    ]
  );

  return {
    closestPin,
    lastMousePos,
    updateClosestPinAndMousePos,
  };
}
