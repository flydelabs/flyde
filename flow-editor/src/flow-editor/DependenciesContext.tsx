import {
  ResolvedDependenciesDefinitions,
  ImportableSource,
  Pos,
} from "@flyde/core";
import { createContext, useContext } from "react";

export interface DependenciesContextData {
  resolvedDependencies: ResolvedDependenciesDefinitions;
  onImportPart: (
    part: ImportableSource,
    target?: {
      pos: Pos;
      selectAfterAdding?: boolean;
      connectTo?: { insId: string; outputId: string };
    }
  ) => Promise<ResolvedDependenciesDefinitions>;
  onRequestImportables: () => Promise<ImportableSource[]>;
}

const DependenciesContext = createContext<DependenciesContextData>({
  resolvedDependencies: {},
  onImportPart: () => Promise.reject(new Error("Not implemented")),
  onRequestImportables: () => Promise.reject(new Error("Not implemented")),
});

export const DependenciesContextProvider = DependenciesContext.Provider;

export const useDependenciesContext = () => {
  return useContext(DependenciesContext);
};
