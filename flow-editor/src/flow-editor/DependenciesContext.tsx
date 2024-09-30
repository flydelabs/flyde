import {
  ResolvedDependenciesDefinitions,
  ImportableSource,
  Pos,
  NodeLibraryData,
  ImportablesResult,
} from "@flyde/core";
import { createContext, useContext } from "react";

export interface DependenciesContextData {
  resolvedDependencies: ResolvedDependenciesDefinitions;
  onImportNode: (
    node: ImportableSource,
    target?: {
      pos: Pos;
      selectAfterAdding?: boolean;
      connectTo?: { insId: string; outputId: string };
    }
  ) => Promise<ResolvedDependenciesDefinitions>;
  onRequestImportables: () => Promise<ImportablesResult>;
  libraryData: NodeLibraryData;
}

const DependenciesContext = createContext<DependenciesContextData>({
  resolvedDependencies: {},
  onImportNode: () => Promise.reject(new Error("Not implemented")),
  onRequestImportables: () => Promise.reject(new Error("Not implemented")),
  libraryData: { groups: [] },
});

export const DependenciesContextProvider = DependenciesContext.Provider;

export const useDependenciesContext = () => {
  return useContext(DependenciesContext);
};
