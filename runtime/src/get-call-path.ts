import { join } from 'path';
import { existsSync } from 'fs';
import * as callsite from 'callsite';
import { request } from 'http';

export const getCallPath = () => {
    const stack = callsite();

    const idx = stack.findIndex(s =>{
      return (s.getFileName() || 'n/a').includes('/runtime/')
        && (s.getFunctionName() || 'n/a').includes('loadFlow')
    });

    if (idx === -1) {
      throw new Error('Could not find runtime in stack');
    }
  
    const requester = stack[idx + 1].getFileName();

    return requester;
  
    // const path = join(requester, '..', flowPath);
  
    // const possiblePaths = [
    //   path,
    //   path.replace('/dist/', '/src/')
    // ];

    // while (possiblePaths.length) {
    //   const path = possiblePaths.shift();
    //   if (existsSync(path)) {
    //     return path;
    //   }
    // }
    // throw new Error(`Could not find flow file at ${possiblePaths.join(',')}`);
  }