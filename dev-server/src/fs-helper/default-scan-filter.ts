const findGitRoot = require('find-git-root');

import { existsSync, readFileSync } from 'fs';
import ignore from 'ignore';
import { join } from 'path';


let cache = {};

const safelyGetGitRoot = (path: string): string | undefined => {
    if (cache[path]) {
        return cache[path];
    }
    try {
        const root = findGitRoot(path);
        if (root) {
            cache[path] = root;
        }
        return root;
    } catch (e) {
        return undefined;
    }
}

export const defaultScanFilter = (path: string, root: string): boolean => {
    const gitRoot = safelyGetGitRoot(root);
    const ignoreFilePath = join(gitRoot, '../.gitignore');

    console.log({ignoreFilePath});
    
    
    if (gitRoot && existsSync(ignoreFilePath)) {
        const ig = ignore().add(readFileSync(ignoreFilePath, 'utf-8'));
        const ignores = ig.ignores(path);

        console.log(ig);
        
        
        return !ignores;
    } else {
        console.log('not using ignore file', ignoreFilePath);
        return !path.includes('node_modules') && !path.includes('dist');
    }

}
