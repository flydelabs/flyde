import {
  Pos,
  NodeLibraryData,
  ImportablesResult,
  MacroNodeDefinition,
  NodeOrMacroDefinition,
} from "@flyde/core";
import { createContext, useContext } from "react";

// TODO - merge this interface with the one from the dev-server
export interface LocalImportableResult {
  importables: any[];
  errors: ImportablesResult["errors"];
}

export interface DependenciesContextData {
  onImportNode: (
    node: any,
    target?: {
      pos: Pos;
      selectAfterAdding?: boolean;
      connectTo?: { insId: string; outputId: string };
    }
  ) => Promise<any>;
  onRequestImportables: () => Promise<LocalImportableResult>;
  libraryData: NodeLibraryData;
  onRequestSiblingNodes: (
    macro: MacroNodeDefinition<any>
  ) => Promise<MacroNodeDefinition<any>[]>;
  onForkNode?: (params: { node: NodeOrMacroDefinition }) => Promise<void>;
}

const DependenciesContext = createContext<DependenciesContextData>({
  onImportNode: () => Promise.reject(new Error("Not implemented")),
  onRequestImportables: () => Promise.reject(new Error("Not implemented")),
  libraryData: { groups: [] },
  onRequestSiblingNodes: () => Promise.resolve([]),
});

export const DependenciesContextProvider = DependenciesContext.Provider;

export const useDependenciesContext = () => {
  return useContext(DependenciesContext);
};
