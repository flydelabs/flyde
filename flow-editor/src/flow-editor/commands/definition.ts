import { ConnectionNode, FlydeFlow, PartInstance } from "@flyde/core";
import { Draft } from "immer";
import { GroupEditorBoardData } from "../../grouped-part-editor/GroupedPartEditor";


export type CommandState = {
  flow: FlydeFlow;
  boardData: GroupEditorBoardData;
  currentPartId: string;
}

export type CommandHandler<T extends EditorCommand> = (
  payload: T["payload"],
  draftState: Draft<CommandState>
) => void;

export type EditorCommandDetachConst = {
  type: "detach-const";
  payload: {
    insId: string;
    inputId: string;
  };
};

export type EditorCommandDuplicateSelected = {
  type: "duplicate-selected";
  payload: {
    selected: string[];
  };
};

export type EditorCommandCloseConnection = {
  type: "close-connection";
  payload: {
    from: ConnectionNode;
    to: ConnectionNode;
  };
};

export type EditorCommandPasteInstances = {
  type: "paste-instances";
  payload: {
    instances: PartInstance[];
  };
};

export type EditorCommand =
  | EditorCommandDetachConst
  | EditorCommandDuplicateSelected
  | EditorCommandCloseConnection
  | EditorCommandPasteInstances;

export type EditorCommandTypes = EditorCommand["type"];
