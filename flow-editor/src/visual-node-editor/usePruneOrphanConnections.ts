import { useEffect } from "react";
import { produce } from "immer";

import {
  ConnectionData,
  NodeInstance,
  VisualNode,
  THIS_INS_ID,
  ImportedNodeDefinition,
  getNodeInputs,
  getNodeOutputs,
  keys,
} from "@flyde/core";
import { FlydeFlowChangeType } from "../flow-editor/flyde-flow-change-type";
import { safelyGetNodeDef } from "../flow-editor/getNodeDef";
import { toastMsg } from "../toaster";

export function usePruneOrphanConnections(
  instances: NodeInstance[],
  connections: ConnectionData[],
  node: VisualNode,
  currResolvedDeps: Record<string, VisualNode | ImportedNodeDefinition>,
  onChange: (newNode: VisualNode, changeType: FlydeFlowChangeType) => void
) {
  useEffect(() => {
    const validInputs = new Map<string, string[]>();
    const validOutputs = new Map<string, string[]>();

    instances.forEach((ins) => {
      const nodeDef = safelyGetNodeDef(ins, currResolvedDeps);
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
      toastMsg(
        `${orphanConnections.length} orphan connections removed`,
        "warning"
      );
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
  }, [instances, onChange, connections, node, currResolvedDeps]);
}
