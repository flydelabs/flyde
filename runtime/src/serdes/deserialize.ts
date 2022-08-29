import { CustomPart, FlydeFlow, flydeFlowSchema } from '@flyde/core';
import * as yaml from 'yaml';

export const deserializeFlow = (flowContents: string): FlydeFlow => {
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