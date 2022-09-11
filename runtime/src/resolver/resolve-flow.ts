import {
  CustomPartRepo,
  isGroupedPart,
  ResolvedFlydeFlow,
  isRefPartInstance,
  FlydeFlow,
  isNativePart,
  NativePart,
  ImportedPart,
} from "@flyde/core";
import { existsSync, readFileSync } from "fs";
import _ = require("lodash");
import { dirname, join, relative } from "path";
import { deserializeFlow } from "../serdes/deserialize";
import { resolveImportablePaths } from "./resolve-importable-paths";
import { namespaceFlowImports } from "./namespace-flow-imports/namespace-flow-imports";

/*
Resolving algorithm:
1. Read and deserialize file
2. Fetch all imports
  - for each module, resolve all imported parts
    - for each imported part, recursively namespace it's dependencies
    - return all parts required for it to run
3. Combine flow parts and imported parts to a single repo
4. Process all parts

*/

export type ResolveMode = "implementation" | "definition" | "bundle";

const _resolveFlow = (
  fullFlowPath: string,
  mode: ResolveMode = "definition",
  namespaceIds = ""
): ResolvedFlydeFlow => {
  const flow = deserializeFlow(readFileSync(fullFlowPath, "utf8"), fullFlowPath);

  const part = flow.part;

  const tempRepo: CustomPartRepo = {
    [part.id]: part,
  };

  const imports = flow.imports;

  const inverseImports = Object.entries(imports)
    .reduce((acc, curr) => {
      const [module, parts] = curr;
      
      const obj = parts.reduce((acc, curr) => ({...acc, [curr as string]: module}), {});
      return {...acc, ...obj};
    }, {});  

  const getLocalOrExternalPaths = (importPath: string) => {
    const fullImportPath = join(fullFlowPath, "..", importPath);

    if (existsSync(fullImportPath)) {
      return [fullImportPath];
    } else {
      return resolveImportablePaths(fullFlowPath, importPath);
    }
  };

  if (isGroupedPart(part)) {
    const refPartIds = _.uniq(part.instances.filter(isRefPartInstance).map((ins) => ins.partId));

    let deps: ResolvedFlydeFlow['dependencies'] = {};

    for (const refPartId of refPartIds) {

      if (refPartId === part.id) {
        // recursive call
        continue;
      }

      const importPath = inverseImports[refPartId];
      if (!importPath) {
        throw new Error(
          `${part.id} in ${fullFlowPath} is using referenced part with id ${refPartId} that is not imported`
        );
      }

      const paths = getLocalOrExternalPaths(importPath);

      const { flow, path } = paths
        .map((path) => {
          const contents = readFileSync(path, "utf-8");
          try {
            return { flow: deserializeFlow(contents, path), path };
          } catch (e) {
            return null
          }
        })
        .filter(obj => !!obj)
        .find((obj) => obj.flow.part.id === refPartId);

      if (!flow) {
        throw new Error(
          `Cannot find part ${refPartId} in ${importPath}. It is imported by ${part.id} (${fullFlowPath})`
        );
      }

      const resolvedImport = resolveFlow(path, mode);
      
      const namespacedImport = namespaceFlowImports(resolvedImport, `${refPartId}__`);

      deps = {
        ...deps,
        ...namespacedImport.dependencies,
        [refPartId]: {
          ...namespacedImport.main, importPath: path
        }
      };

      /* 
        when flow is resolved for bundling, replace functions with a special directive that will result in a require statement instead of the function
        TODO - check if this is really required
      */

      deps = _.mapValues(deps, (val: ImportedPart, key) => {
        const part = val as NativePart;
        if (typeof part.fn === 'function' && mode === 'bundle') {
          const flowFolder = dirname(fullFlowPath);
          const requirePath = relative(flowFolder, val.importPath);
          part.fn = `__BUNDLE_FN:[[${requirePath}]]` as any;
          return {...val, part}
        }
        return val;
      });
    }

    return { main: part, dependencies: deps };
  } else {
    return { main: part, dependencies: {} };
  }
};

export const resolveFlow = _resolveFlow;
