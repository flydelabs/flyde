import { CustomPart, FlydeFlow, flydeFlowSchema } from '@flyde/core';
import * as yaml from 'yaml';
import * as rfs from 'require-from-string';


export const deserializeCodeFlow = (contents: string, fileName: string): FlydeFlow => {
  const part = rfs(contents, fileName);

  // TODO - validate part

  part.__importFrom = fileName; // TODO - remove this when all flows come with imported from

  return {
    exports: [part.id],
    parts: {[part.id]: part},
    mainId: part.id,
    imports: {}
  }
}

export const deserializVisualFlow = (flowContents: string): FlydeFlow => {

  const unsafeflow = yaml.parse(flowContents);

  const result = flydeFlowSchema.safeParse(unsafeflow);
  if (result.success === false) {
    throw new Error(`Error parsing Flyde flow ${result.error}`);
  }

  const data = result.data;

  const imports = data.imports || {};

  for (const importPath in imports) {
    const importedData = imports[importPath] || [];

    const fixed = importedData.map((importDef) => {
      if (typeof importDef === 'string') {
        return {
          name: importDef,
          alias: importDef
        };
      } else {
        return importDef
      }
    });

    imports[importPath] = fixed;
  }

  data.imports = imports;

  // add ids
  for (const partId in data.parts) {
    const part = data.parts[partId] as CustomPart; 
    part.id = partId;
  }
  return {imports: {}, exports: [], ...data as any};
}

export const deserializeFlow = (flowContents: string, fileName: string): FlydeFlow => {
  if (fileName.endsWith('.flyde')) {
    return deserializVisualFlow(flowContents);
  } else {
    return deserializeCodeFlow(flowContents, fileName);
  }
}