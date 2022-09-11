import { CustomPart, FlydeFlow, flydeFlowSchema } from '@flyde/core';
import * as yaml from 'yaml';
import * as rfs from 'require-from-string';
import _ = require('lodash');


export const deserializeCodeFlow = (contents: string, fileName: string): FlydeFlow => {
  const part = rfs(contents, fileName);

  // TODO - validate part
  part.__importFrom = fileName; // TODO - remove this when all flows come with imported from

  return {
    part,
    imports: {}
  }
}

export const deserializeVisualFlow = (flowContents: string): FlydeFlow => {

  const unsafeflow = yaml.parse(flowContents);

  const result = flydeFlowSchema.safeParse(unsafeflow);
  if (result.success === false) {
    throw new Error(`Error parsing Flyde flow ${result.error}`);
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
    return deserializeVisualFlow(flowContents);
  } else {
    return deserializeCodeFlow(flowContents, fileName);
  }
}