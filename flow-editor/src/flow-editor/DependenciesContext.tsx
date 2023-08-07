import {
  ResolvedDependenciesDefinitions,
  ImportableSource,
  Pos,
} from "@flyde/core";
import type { ImportablesResult } from "@flyde/dev-server";
import { createContext, useContext } from "react";

// TODO - merge this interface with the one from the dev-server
export interface LocalImportableResult {
  importables: ImportableSource[];
  errors: ImportablesResult["errors"];
}

export interface DependenciesContextData {
  resolvedDependencies: ResolvedDependenciesDefinitions;
  onImportNode: (
    part: ImportableSource,
    target?: {
      pos: Pos;
      selectAfterAdding?: boolean;
      connectTo?: { insId: string; outputId: string };
    }
  ) => Promise<ResolvedDependenciesDefinitions>;
  onRequestImportables: () => Promise<LocalImportableResult>;
}

const DependenciesContext = createContext<DependenciesContextData>({
  resolvedDependencies: {},
  onImportNode: () => Promise.reject(new Error("Not implemented")),
  onRequestImportables: () => Promise.reject(new Error("Not implemented")),
});

export const DependenciesContextProvider = DependenciesContext.Provider;

export const useDependenciesContext = () => {
  return useContext(DependenciesContext);
};
