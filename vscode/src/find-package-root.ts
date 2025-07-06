import * as vscode from 'vscode';

const {Uri} = vscode;
const {fs} = vscode.workspace;

let cache = new Map();

export const findPackageRoot = async (uri: vscode.Uri, max = 10): Promise<vscode.Uri | null> => {

    const fromCache = cache.get(uri);
    if (fromCache) {
        return fromCache;
    }
    const parent = Uri.joinPath(uri, '..');
    try {
        const maybePJsonUri = Uri.joinPath(parent, 'package.json');
        await fs.stat(maybePJsonUri);
        return parent;
    } catch (e) {
        if (max > 0) {
            const res = await findPackageRoot(parent, max - 1);
            cache.set(uri, res);
            return res;
        } else {
            return null;
        }
    }
}