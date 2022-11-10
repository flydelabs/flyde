import { FlydeFlow, flydeFlowSchema } from '@flyde/core';
import * as yaml from 'yaml';

export const serializeFlow = (flow: FlydeFlow) => {

  let parsed = flydeFlowSchema.parse(flow);
  
  return yaml.stringify(parsed, {aliasDuplicateObjects: false});
}