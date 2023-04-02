import {
  ResolvedDependenciesDefinitions,
  ImportablePart,
  Pos,
  PartInstance,
} from "@flyde/core";
import { createContext, useContext } from "react";

export interface DependenciesContextData {
  resolvedDependencies: ResolvedDependenciesDefinitions;
  onImportPart: (
    part: ImportablePart,
    target?: {
      pos: Pos;
      selectAfterAdding?: boolean;
      connectTo?: { insId: string; outputId: string };
    }
  ) => Promise<PartInstance | undefined>;
  onRequestImportables: () => Promise<ImportablePart[]>;
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
