import { BasePart, CustomPartRepo, FlydeFlow, isGroupedPart, Part, ResolvedFlydeFlow, ResolvedFlydeFlowDefinition, ResolvedFlydeRuntimeFlow, FlydeFlowImportDef, keys, CustomPart, isCodePart, NativePart, PartRepo } from "@flyde/core";
import { existsSync, readFileSync } from "fs";
import { dirname, join, relative } from "path";
import { deserializeFlow } from "../serdes/deserialize";
import { resolveImportablePaths } from "./resolve-importable-paths";
import { resolvePartWithDeps } from "./resolve-part-with-deps/resolve-part-with-deps";


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

export type ResolveMode = 'implementation' | 'definition' | 'bundle';

const resolveImports = <T extends ResolvedFlydeFlow>(resolvedImportedFlow: T, importDefs: FlydeFlowImportDef[]): T => {
  return importDefs.reduce((acc, importDef) => {
    const part = resolvedImportedFlow[importDef.name];

    if (!part) {
      throw new Error(
        `Error importing shared part ${importDef.name} from ${resolvedImportedFlow} - part not found`
      );
    }

    const withDeps = resolvePartWithDeps(resolvedImportedFlow, importDef.name);

    const aliasedDeps: any = {};
    for (const partId in withDeps) {
      const part = withDeps[partId];
      if (part.id === importDef.name) {
        aliasedDeps[importDef.alias] = {...part, id: importDef.alias};
      } else {
        aliasedDeps[partId] = part;
      }
    }

    return {...acc, ...aliasedDeps};
  }, {});
}


const _resolveFlow = (fullFlowPath: string, mode: ResolveMode = 'definition', exportedOnly: boolean = false): ResolvedFlydeFlow => {
  
  const flow = deserializeFlow(readFileSync(fullFlowPath, "utf8"));

  const parts = flow.parts || {};

  const tempRepo: CustomPartRepo = {
    ...parts,
  };

  const imports = flow.imports;
  const exports = flow.exports;

  const getLocalOrExternalPaths = (importPath: string) => {
    const fullImportPath = join(fullFlowPath, '..', importPath);
  
    if (existsSync(fullImportPath)) {
      return [fullImportPath];
    } else {
      return resolveImportablePaths(fullFlowPath, importPath);
    }
  }


  for (const importPath in imports) {


    const importablePaths = getLocalOrExternalPaths(importPath);

    let importData = {};

    const exports  = new Set();
    for (const fullPath of importablePaths) {
      
      if (existsSync(fullPath)) {
        const contents = readFileSync(fullPath, "utf8");
        const flow = deserializeFlow(contents);
        const resolvedImport = _resolveFlow(fullPath, mode);
        

        flow.exports.forEach((exp) => {
          console.log(exp);
          
          if (exports.has(exp)) {
            throw new Error(`Module ${importPath} is exporting part "${exp}" which was already exported by another package.`);
          }
          exports.add(exp);
        });
        
        importData = { ...importData, ...resolvedImport };
        
      } else {
        throw new Error(`Error importing ${importPath} - file does not exist`);
      }
    }

    const importDefs = imports[importPath];

    importDefs.forEach((def) => {
      if (!exports.has(def.name)) {
        throw new Error(`Module ${importPath} is not exporting part "${def.name}"`);
      }
    });

    const importedRepo = resolveImports(importData, importDefs);

    for (const partId in importedRepo) {
      if (tempRepo[partId]) {
        throw new Error(
          `Error importing shared part ${partId} from ${importPath} - shared part already exists in repo`
        );
      }
      tempRepo[partId] = importedRepo[partId];
    }
 
  }
  
  const repo: PartRepo = {};
  for (const name in tempRepo) {
    const part: CustomPart = tempRepo[name];
    
    if (!part) {
      throw new Error(`Error resolving shared part ${name} - part not found`);
    }

    part.id = name;
    repo[name] = part;

    if (isCodePart(part)) {

      const refMatches = part.fnCode.match(/^ref:(.*)$/);

  
      const nativePart = (part as any) as NativePart;
      if (refMatches) {
        const [_, ref] = refMatches;

        if (mode === 'implementation' || mode === 'bundle') {

          const flowFolder = dirname(fullFlowPath);
          
          const fnPath = join(flowFolder, ref);
          const requirePath = relative(flowFolder, fnPath);
          
          if (mode === 'bundle') {
            nativePart.fn = `__BUNDLE:[[${requirePath}]]` as any;
          } else {
            nativePart.fn = require("./" + requirePath);
          }

          delete (nativePart as any).fnCode;
          repo[name] = nativePart;
        }
      }
    }
  }  

  return repo;
};


export const resolveFlow = _resolveFlow;