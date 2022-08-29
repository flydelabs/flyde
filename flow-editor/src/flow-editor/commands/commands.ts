import { produce } from "immer";
import { CommandHandler, CommandState, EditorCommand, EditorCommandTypes } from "./definition";
import { handleDetachConstEditorCommand, handleDuplicateSelectedEditorCommand, handleConnectionCloseEditorCommand, handlePasteInstancesEditorCommand } from "./handlers";

export type EditorCommandHandlersMap = {
  [Property in EditorCommandTypes]: CommandHandler<EditorCommand>;
}

export const handlersMap = {
    "detach-const": handleDetachConstEditorCommand,
    "duplicate-selected": handleDuplicateSelectedEditorCommand,
    "close-connection": handleConnectionCloseEditorCommand,
    "paste-instances": handlePasteInstancesEditorCommand,
  };

export const createEditorCommand = <T extends EditorCommand>(type: T['type'], payload: T['payload']): EditorCommand => {
    return {type, payload} as EditorCommand;
}

export const handleCommand = (
  command: EditorCommand,
  state: CommandState
) => {
  
  const handler = handlersMap[command.type];
  if (!handler) {
    throw new Error(`no handler for command ${command.type}`);
  }
  return produce(state, draft => handler(command.payload as any, draft));
};
