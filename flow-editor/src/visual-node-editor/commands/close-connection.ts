import {
  ConnectionData,
  connectionNodeEquals,
  VisualNode,
  isInternalConnectionNode,
  isStaticInputPinConfig,
} from "@flyde/core";
import produce from "immer";
import { handleDetachConstEditorCommand } from "./detach-const";

export const handleConnectionCloseEditorCommand = (
  node: VisualNode,
  { from, to }: ConnectionData
) => {
  return produce(node, (draft) => {
    const existing = draft.connections.find((conn) => {
      const fromEq = connectionNodeEquals(from, conn.from);
      const toEq = connectionNodeEquals(to, conn.to);
      return fromEq && toEq;
    });

    if (existing) {
      draft.connections = draft.connections.filter((conn) => conn !== existing);
    } else {
      draft.connections.push({
        from,
        to,
      });
    }
  });

  //   const maybeIns = isInternalConnectionNode(to) ? instances.find((i) => i.id === to.insId) : null;
  //   const inputConfig = maybeIns ? maybeIns.inputConfig : {};
  //   const pinConfig = inputConfig[to.pinId];
  //   const isTargetStaticValue = isStaticInputPinConfig(pinConfig);

  //   if (isTargetStaticValue) {
  //     handleDetachConstEditorCommand(
  //       { insId: to.insId, inputId: to.pinId },
  //       draft
  //     );
  //   }
  // draft.boardData.from = undefined;
  // draft.boardData.to = undefined;
};
