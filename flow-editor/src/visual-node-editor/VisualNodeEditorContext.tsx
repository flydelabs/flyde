import React from "react";
import { EditorVisualNode } from "@flyde/core";
import { GroupEditorBoardData } from "./VisualNodeEditor";
import { FlydeFlowChangeType } from "../flow-editor/flyde-flow-change-type";

export interface VisualNodeEditorContextType {
  boardData: GroupEditorBoardData;
  onChangeBoardData: (partial: Partial<GroupEditorBoardData>) => void;
  node: EditorVisualNode;
  onChangeNode: (newNode: EditorVisualNode, changeType: FlydeFlowChangeType) => void;
}

export const VisualNodeEditorContext = React.createContext<
  VisualNodeEditorContextType | undefined
>(undefined);

export const useVisualNodeEditorContext = () => {
  const context = React.useContext(VisualNodeEditorContext);

  if (context === undefined) {
    throw new Error(
      "useVisualNodeEditorContext must be used within a VisualNodeEditorProvider"
    );
  }
  return context;
};

export const VisualNodeEditorProvider: React.FC<
  VisualNodeEditorContextType & { children: React.ReactNode }
> = ({ children, ...contextValue }) => {
  return (
    <VisualNodeEditorContext.Provider value={contextValue}>
      {children}
    </VisualNodeEditorContext.Provider>
  );
};
