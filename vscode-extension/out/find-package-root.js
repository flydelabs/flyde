"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPackageRoot = void 0;
const vscode = require("vscode");
const { Uri } = vscode;
const { fs } = vscode.workspace;
let cache = new Map();
const findPackageRoot = async (uri, max = 10) => {
    const fromCache = cache.get(uri);
    if (fromCache) {
        return fromCache;
    }
    const parent = Uri.joinPath(uri, '..');
    try {
        const maybePJsonUri = Uri.joinPath(parent, 'package.json');
        await fs.stat(maybePJsonUri);
        return parent;
    }
    catch (e) {
        if (max > 0) {
            const res = await (0, exports.findPackageRoot)(parent, max - 1);
            cache.set(uri, res);
            return res;
        }
        else {
            return null;
        }
    }
};
exports.findPackageRoot = findPackageRoot;
//# sourceMappingURL=find-package-root.js.map