import { ConnectionData, connectionNodeEquals, EditorVisualNode } from "@flyde/core";
import produce from "immer";

export const handleConnectionCloseEditorCommand = (
  node: EditorVisualNode,
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
};
