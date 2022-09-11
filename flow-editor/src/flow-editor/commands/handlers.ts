import {
  GroupedPart,
  isStaticInputPinConfig,
  CodePartTemplateTypeInline,
  partInstance,
  connectionData,
  connectionNodeEquals,
  isInternalConnectionNode,
  isCodePart,
  randomInt,
  queueInputPinConfig,
  inlinePartInstance,
} from "@flyde/core";
import { vAdd, vec } from "../..";
import { createInlineCodePart } from "../inline-code-modal/inline-code-to-part";
import {
    CommandHandler,
  EditorCommandCloseConnection,
  EditorCommandDetachConst,
  EditorCommandDuplicateSelected,
  EditorCommandPasteInstances,
} from "./definition";  

export const handleDetachConstEditorCommand: CommandHandler<EditorCommandDetachConst> = (
  payload,
  draft
) => {
  const { insId, inputId: pinId } = payload;
  const part = draft.flow.part;
  const { instances } = part;

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

  const f = part.instances.find((_ins) => _ins.id === instance.id);

  if (!f) {
    throw new Error(`impossible state instance not found`);
  }

  instance.inputConfig[pinId] = queueInputPinConfig();

  part.instances.push(newIns);
  part.connections.push(connectionData(`${newIns.id}.r`, `${instance.id}.${pinId}`));
};

export const handleConnectionCloseEditorCommand: CommandHandler<EditorCommandCloseConnection> = (
  payload,
  draft
) => {
  const { from, to } = payload;
  const part = draft.flow.part as GroupedPart;
  const instances = part.instances;

  const existing = part.connections.find((conn) => {
    const fromEq = connectionNodeEquals(from, conn.from);
    const toEq = connectionNodeEquals(to, conn.to);
    return fromEq && toEq;
  });
  if (existing) {
    part.connections = part.connections.filter((conn) => conn !== existing);
  } else {
    part.connections.push({
      from,
      to,
    });

    const maybeIns = isInternalConnectionNode(to) ? instances.find((i) => i.id === to.insId) : null;
    const inputConfig = maybeIns ? maybeIns.inputConfig : {};
    const pinConfig = inputConfig[to.pinId];
    const isTargetStaticValue = isStaticInputPinConfig(pinConfig);

    if (isTargetStaticValue) {
      handleDetachConstEditorCommand(
        { insId: to.insId, inputId: to.pinId },
        draft
      );
    }
  }
  draft.boardData.from = undefined;
  draft.boardData.to = undefined;
};

export const handleDuplicateSelectedEditorCommand: CommandHandler<EditorCommandDuplicateSelected> = (
  payload,
  draft
) => {
  const { selected } = payload;
  const { instances } = draft.flow.part;


  if (selected.length) {
    const newInstances = [];
    selected.forEach((id) => {
      const ins = instances.find((ins) => ins.id === id);

      if (!ins) {
        throw new Error(`impossible state duplicate selected no matching instance`);
      }

      if (ins) {
        const { pos } = ins;
        const newIns = {
          ...ins,
          pos: { x: pos.x + 20, y: pos.y + 20 },
          id: `${ins.id}-d${randomInt(999)}`,
        };
        instances.push(newIns);
        newInstances.push(newIns.id)
      }
    });
    draft.boardData.selected = newInstances;
  }
};

export const handlePasteInstancesEditorCommand: CommandHandler<EditorCommandPasteInstances> = (
  payload,
  draft
) => {
  const pasteOffset = vec(10, 10);
  const { instances } = payload;
  const part = draft.flow.part;

  const newInstances = instances.map((ins) => {

    return {
      ...ins,
      pos: vAdd(ins.pos, pasteOffset),
      id: `${ins.id}-copy`
    };
  });

  draft.boardData.selected = newInstances.map(ins => ins.id);
      
  part.instances.push(...newInstances);

  const newConnections = part.connections.filter((conn) => {
    const from = instances.find((i) => i.id === conn.from.insId);
    const to = instances.find((i) => i.id === conn.to.insId);
    return from && to;
  })
  .map(({from, to}) => {
    return {
      from: { ...from, insId: `${from.insId}-copy` },
      to: { ...to, insId: `${to.insId}-copy` },
    };
  });

  part.connections.push(...newConnections);
}