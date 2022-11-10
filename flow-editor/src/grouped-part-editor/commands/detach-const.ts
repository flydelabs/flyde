import { CodePartTemplateTypeInline, connectionData, GroupedPart, inlinePartInstance, isStaticInputPinConfig, queueInputPinConfig, randomInt } from "@flyde/core";
import produce from "immer";
import { createInlineCodePart } from "../../flow-editor/inline-code-modal/inline-code-to-part";

export const handleDetachConstEditorCommand = (
    part: GroupedPart,
    insId: string,
    pinId: string
  ) => {
      
      return produce(part, draft => {
        const { instances } = draft;
        const instance = instances.find((i) => i.id === insId);
        if (!instance) {
          throw new Error(`Impossible state ins id with no matching instance`);
        }
      
        const inputConfig = instance.inputConfig[pinId];
      
        if (!inputConfig) {
          throw new Error("impossible state detaching const from unexistent config");
        }
      
        if (!isStaticInputPinConfig(inputConfig)) {
          throw new Error("impossible state detaching const with no value");
        }
      
        const value = inputConfig.value;
      
        const newPart = createInlineCodePart({
          code: `${value}`,
          type: CodePartTemplateTypeInline.VALUE,
        });
      
        const newIns = inlinePartInstance(
          `value-${randomInt(999)}`,
          newPart,
          {},
          { x: instance.pos.x, y: instance.pos.y - 100 }
        );
      
        const f = draft.instances.find((_ins) => _ins.id === instance.id);
      
        if (!f) {
          throw new Error(`impossible state instance not found`);
        }
      
        instance.inputConfig[pinId] = queueInputPinConfig();
      
        draft.instances.push(newIns);
        draft.connections.push(connectionData(`${newIns.id}.r`, `${instance.id}.${pinId}`));
    })    
  };