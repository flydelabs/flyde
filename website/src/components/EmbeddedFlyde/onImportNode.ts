import {
  ImportableSource,
  isBaseNode,
  Node,
  NodeInstance,
  ResolvedDependencies,
  TRIGGER_PIN_ID,
} from "@flyde/core";
import {
  DependenciesContextData,
  FlowEditorState,
  createNewNodeInstance,
  vAdd,
} from "@flyde/flow-editor";
import produce from "immer";

export async function onImportNode(
  importedNode: ImportableSource,
  target: Parameters<DependenciesContextData["onImportNode"]>[1],
  editorState: FlowEditorState,
  deps: ResolvedDependencies
) {
  const { node } = importedNode;

  const depNode = Object.values(
    await import("@flyde/stdlib/dist/all-browser")
  ).find((p) => isBaseNode(p) && p.id === node.id) as Node;

  const newDeps: ResolvedDependencies = {
    ...deps,
    [depNode.id]: {
      ...depNode,
      source: {
        path: "@flyde/stdlib/dist/all-browser",
        export: depNode.id,
      },
    },
  };

  let newNodeIns: NodeInstance | undefined = undefined;

  const newFlow = produce(editorState.flow, (draft) => {
    if (target) {
      const finalPos = vAdd({ x: 0, y: 0 }, target.pos);
      newNodeIns = createNewNodeInstance(
        importedNode.node,
        0,
        finalPos,
        newDeps
      );
      draft.node.instances.push(newNodeIns);

      if (target.connectTo) {
        const { insId, outputId } = target.connectTo;
        draft.node.connections.push({
          from: {
            insId,
            pinId: outputId,
          },
          to: {
            insId: newNodeIns.id,
            pinId: TRIGGER_PIN_ID,
          },
        });
      }
    }
  });

  const newState = produce(editorState, (draft) => {
    draft.flow = newFlow;
    if (target?.selectAfterAdding && newNodeIns) {
      draft.boardData.selected = [newNodeIns?.id];
    }
  });

  return { newState, newDeps };
}
