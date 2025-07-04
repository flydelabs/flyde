import { useEffect } from "react";
import { produce } from "immer";

import {
  ConnectionData,
  NodeInstance,
  VisualNode,
  THIS_INS_ID,
  getNodeInputs,
  getNodeOutputs,
  keys,
  EditorVisualNode,
} from "@flyde/core";
import { FlydeFlowChangeType } from "../flow-editor/flyde-flow-change-type";
import { useToast } from "../ui";

export function usePruneOrphanConnections(
  instances: NodeInstance[],
  connections: ConnectionData[],
  node: EditorVisualNode,
  onChange: (newNode: EditorVisualNode, changeType: FlydeFlowChangeType) => void
) {
  const { toast } = useToast();
  useEffect(() => {
    const validInputs = new Map<string, string[]>();
    const validOutputs = new Map<string, string[]>();

    // ugly hack in mid big refactor - TODO: rethink
    const isLoading = node.instances.some(
      (ins) => ins.node.id === "__loading__"
    );

    if (isLoading) {
      return;
    }

    instances.forEach((ins, idx) => {
      const nodeDef = node.instances[idx]?.node;
      if (nodeDef) {
        validInputs.set(ins.id, keys(getNodeInputs(nodeDef)));
        validOutputs.set(ins.id, keys(getNodeOutputs(nodeDef)));
      }
    });

    validInputs.set(THIS_INS_ID, keys(node.outputs));
    validOutputs.set(THIS_INS_ID, keys(node.inputs));

    const orphanConnections = connections.filter((conn) => {
      const inputsExist = validInputs
        .get(conn.to.insId)
        ?.includes(conn.to.pinId);
      const outputsExist = validOutputs
        .get(conn.from.insId)
        ?.includes(conn.from.pinId);
      return !(inputsExist && outputsExist);
    });

    if (orphanConnections.length > 0) {
      console.warn(
        `${orphanConnections.length} orphan connections removed`,
        orphanConnections
      );

      const newNode = produce(node, (draft) => {
        draft.connections = node.connections.filter(
          (conn) => !orphanConnections.includes(conn)
        );
      });
      onChange(newNode, {
        type: "functional",
        message: "prune orphan connections",
      });
    }
  }, [instances, onChange, connections, node, toast]);
}
