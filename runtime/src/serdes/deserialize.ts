import { CustomPart, FlydeFlow, flydeFlowSchema } from '@flyde/core';
import * as yaml from 'yaml';
import * as rfs from 'require-from-string';
import _ = require('lodash');


export const deserializeCodeFlow = (contents: string, fileName: string): FlydeFlow => {
  const part = rfs(contents, fileName);

  // TODO - validate part

  return {
    part,
    imports: {}
  }
}

export const deserializeVisualFlow = (flowContents: string, path: string): FlydeFlow => {

  const unsafeflow = yaml.parse(flowContents);

  const result = flydeFlowSchema.safeParse(unsafeflow);
  if (result.success === false) {
    throw new Error(`Error parsing Flyde flow ${result.error} from ${path}`);
  }

  const data = result.data;

  const imports = _.mapValues(data.imports || {}, (value) => {
    return typeof value === 'string' ? [value] : value;
  });

  data.imports = imports;
  
  return data as FlydeFlow;
}

export const deserializeFlow = (flowContents: string, fileName: string): FlydeFlow => {
  if (fileName.endsWith('.flyde')) {
    return deserializeVisualFlow(flowContents, fileName);
  } else {
    return deserializeCodeFlow(flowContents, fileName);
  }
}