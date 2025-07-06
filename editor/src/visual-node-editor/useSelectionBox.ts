import { useState, useCallback } from "react";

import { } from "../utils";
import { Pos, VisualNode } from "@flyde/core";
import { domToViewPort, calcSelectionBoxArea, getInstancesInRect, ViewPort } from "..";

const ALLOWED_SELECTION_BOX_CLASSES = [
  "board-editor-inner",
  "connections-view",
];

export const useSelectionBox = (node: VisualNode, viewPort: ViewPort, boardPos: Pos, parentViewport: ViewPort) => {
  const [selectionBox, setSelectionBox] = useState<{ from: Pos; to: Pos }>();

  const startSelectionBox = useCallback(
    (event: React.MouseEvent<any>) => {
      const target = event.nativeEvent.target as HTMLElement;

      if (
        !target ||
        !ALLOWED_SELECTION_BOX_CLASSES.includes(target.getAttribute("class") ?? '')
      ) {
        return;
      }
      const eventPos = { x: event.clientX, y: event.clientY };

      const normalizedPos = {
        x: eventPos.x - boardPos.x,
        y: eventPos.y - boardPos.y,
      };
      const posInBoard = domToViewPort(normalizedPos, viewPort, parentViewport);
      setSelectionBox({ from: posInBoard, to: posInBoard });
    },
    [boardPos, viewPort, parentViewport]
  );

  const updateSelectionBox = useCallback(
    (posInBoard: Pos) => {
      if (!selectionBox) {
        return;
      }
      setSelectionBox({ ...selectionBox, to: posInBoard });
    },
    [selectionBox]
  );

  const endSelectionBox = useCallback(
    (shiftKey: boolean, onSelect: (ids: string[]) => void) => {
      if (selectionBox && calcSelectionBoxArea(selectionBox) > 50) {
        const toSelect = getInstancesInRect(
          selectionBox,
          viewPort,
          node.instances,
          parentViewport,
          node.inputsPosition,
          node.outputsPosition
        );
        onSelect(toSelect);
      }
      setSelectionBox(undefined);
    },
    [selectionBox, viewPort, node, parentViewport]
  );

  return {
    selectionBox,
    startSelectionBox,
    updateSelectionBox,
    endSelectionBox,
  };
};
