import { readFileSync } from 'fs';
import { relative } from 'path';
import * as Walker from 'walker';

export type ScanFilter = (relPath: string, root: string) => boolean;

export const findInFiles = (root: string, pattern: RegExp, filter: ScanFilter): Promise<Array<{ path: string; line: string; matches: string[] }>> => {
    return new Promise((resolve, reject) => {
        const results: Array<{ path: string; line: string, matches: string[] }> = [];
        Walker(root)
        .filterDir(dir => {
            const rel = relative(root, dir);
            if (!rel) {
                return true;
            }
            return filter(rel, root);
        })
        .on('file', (filePath) => {
            const rel = relative(root, filePath);
            if (!filter(rel, root)) {
                return;
            }
            const contents = readFileSync(filePath, 'utf-8');
            contents.split('\n')
            .forEach(line => {
                const matches = line.match(pattern);
                if (matches) {
                    results.push({
                        path: filePath,
                        matches: matches,
                        line
                    });
                }
            });
        }).on('end', () => {
            resolve(results);
        }).on('error', (err) => {
            reject(err);
        });
    });
}
