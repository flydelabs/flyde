"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanFolderStructure = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const default_scan_filter_1 = require("../fs-helper/default-scan-filter");
const scanFolderStructure = (path, root = path, maxDepth = 7, filter = default_scan_filter_1.defaultScanFilter) => {
    const files = (0, fs_1.readdirSync)(path);
    let res = [];
    for (const file of files) {
        const filePath = (0, path_1.join)(path, file);
        const stats = (0, fs_1.lstatSync)(filePath);
        if (!filter(filePath, root)) {
            continue;
        }
        if (stats.isDirectory() && maxDepth > 0) {
            res.push({
                name: file,
                children: (0, exports.scanFolderStructure)(filePath, root, maxDepth - 1, filter),
                isFolder: true,
                fullPath: filePath,
                relativePath: (0, path_1.relative)(root, filePath),
            });
        }
        else {
            res.push({
                name: file,
                isFolder: false,
                fullPath: filePath,
                relativePath: (0, path_1.relative)(root, filePath),
                isFlyde: file.endsWith(".flyde"),
                isFlydeCode: file.endsWith(".flyde.js") || file.endsWith(".flyde.ts"),
            });
        }
    }
    return res;
};
exports.scanFolderStructure = scanFolderStructure;
//# sourceMappingURL=scan-folders-structure.js.map