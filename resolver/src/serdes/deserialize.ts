import { CustomPart, FlydeFlow, flydeFlowSchema } from '@flyde/core';
import * as yaml from 'yaml';
import * as rfs from 'require-from-string';
import _ = require('lodash');
import * as path from 'path';

require('ts-node').register({ // Most ts-node options can be specified here using their programmatic names.
transpileOnly: true
  // It is faster to skip typechecking.
  // Remove if you want ts-node to do typechecking.
// }
});


export const deserializeCodeFlow = (contents: string, fileName: string): FlydeFlow => {

  let part = require(fileName);

  if (part.default) {
    part = part.default;
  }

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
    try {
      return deserializeCodeFlow(flowContents, fileName);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}