"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultScanFilter = void 0;
const findGitRoot = require("find-git-root");
const fs_1 = require("fs");
const ignore_1 = require("ignore");
const path_1 = require("path");
let cache = {};
const safelyGetGitRoot = (path) => {
    if (cache[path]) {
        return cache[path];
    }
    try {
        let root = findGitRoot(path);
        if (root) {
            root = (0, path_1.join)(root, ".."); // find git root finds the ".git" folder, we want the parent folder
            cache[path] = root;
        }
        return root;
    }
    catch (e) {
        return undefined;
    }
};
const defaultScanFilter = (path, root) => {
    const gitRoot = safelyGetGitRoot(root);
    const ignoreFilePath = gitRoot ? (0, path_1.join)(gitRoot, "../.gitignore") : undefined;
    if (gitRoot && ignoreFilePath && (0, fs_1.existsSync)(ignoreFilePath)) {
        const relativePath = (0, path_1.relative)(path, gitRoot);
        const ig = (0, ignore_1.default)().add((0, fs_1.readFileSync)(ignoreFilePath, "utf-8"));
        const ignores = ig.ignores(relativePath);
        return !ignores;
    }
    else {
        return !path.includes("node_modules") && !path.includes("dist");
    }
};
exports.defaultScanFilter = defaultScanFilter;
//# sourceMappingURL=default-scan-filter.js.map