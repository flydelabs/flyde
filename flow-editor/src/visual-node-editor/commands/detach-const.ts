import {
  InlineValueNodeType,
  connectionData,
  VisualNode,
  inlineNodeInstance,
  isStaticInputPinConfig,
  queueInputPinConfig,
  randomInt,
} from "@flyde/core";
import produce from "immer";
import { createInlineValueNode } from "../../flow-editor/inline-code-modal/inline-code-to-node";

export const handleDetachConstEditorCommand = (
  node: VisualNode,
  insId: string,
  pinId: string
) => {
  return produce(node, (draft) => {
    const { instances } = draft;
    const instance = instances.find((i) => i.id === insId);
    if (!instance) {
      throw new Error(`Impossible state ins id with no matching instance`);
    }

    const inputConfig = instance.inputConfig[pinId];

    if (!inputConfig) {
      throw new Error(
        "impossible state detaching const from unexistent config"
      );
    }

    if (!isStaticInputPinConfig(inputConfig)) {
      throw new Error("impossible state detaching const with no value");
    }

    const value = JSON.stringify(inputConfig.value);

    const newNode = createInlineValueNode({
      code: `${value}`,
      type: InlineValueNodeType.VALUE,
    });

    const newIns = inlineNodeInstance(
      `value-${randomInt(999)}`,
      newNode,
      {},
      { x: instance.pos.x, y: instance.pos.y - 100 }
    );

    const f = draft.instances.find((_ins) => _ins.id === instance.id);

    if (!f) {
      throw new Error(`impossible state instance not found`);
    }

    instance.inputConfig[pinId] = queueInputPinConfig();

    draft.instances.push(newIns);
    draft.connections.push(
      connectionData(`${newIns.id}.value`, `${instance.id}.${pinId}`)
    );
  });
};
