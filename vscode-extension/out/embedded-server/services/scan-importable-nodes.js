"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanImportableNodes = scanImportableNodes;
const path_1 = require("path");
const loader_1 = require("@flyde/loader");
const core_1 = require("@flyde/core");
const get_flyde_dependencies_1 = require("./get-flyde-dependencies");
const resolve_dependent_packages_1 = require("./resolve-dependent-packages");
const StdLib = require("@flyde/nodes/dist/all");
const fs_1 = require("fs");
const scan_folders_structure_1 = require("./scan-folders-structure");
async function scanImportableNodes(rootPath, relativePath) {
    const fileRoot = (0, path_1.join)(rootPath, relativePath);
    const localFiles = getLocalFlydeFiles(rootPath);
    const depsNames = await (0, get_flyde_dependencies_1.getFlydeDependencies)(rootPath);
    const depsNodes = await (0, resolve_dependent_packages_1.resolveDependentPackages)(rootPath, depsNames);
    let builtInStdLib = {};
    if (!depsNames.includes("@flyde/stdlib")) {
        (0, core_1.debugLogger)("Using built-in stdlib");
        const nodes = Object.fromEntries(Object.entries(StdLib)
            .filter((pair) => (0, core_1.isCodeNode)(pair[1]))
            .map(([id, node]) => [
            id,
            (0, core_1.codeNodeToImportableEditorNode)(node, {
                type: "package",
                data: "@flyde/stdlib",
            }),
        ]));
        builtInStdLib = {
            "@flyde/stdlib": Object.values(nodes),
        };
    }
    let allErrors = [];
    const localNodes = localFiles
        .filter((file) => !file.relativePath.endsWith(relativePath))
        .reduce((acc, file) => {
        if ((0, loader_1.isCodeNodePath)(file.fullPath)) {
            const { errors, nodes } = (0, loader_1.resolveCodeNodeDependencies)(file.fullPath);
            allErrors.push(...errors.map((err) => ({ path: file.fullPath, message: err })));
            const nodesObj = nodes.map(({ node }) => {
                const relativePath = (0, path_1.relative)((0, path_1.join)(fileRoot, ".."), file.fullPath);
                const importableNode = (0, core_1.codeNodeToImportableEditorNode)(node, {
                    type: "file",
                    data: relativePath,
                });
                return importableNode;
            });
            const relativePath = (0, path_1.relative)((0, path_1.join)(fileRoot, ".."), file.fullPath);
            acc[relativePath] ?? (acc[relativePath] = []);
            acc[relativePath] = [...acc[relativePath], ...nodesObj];
            return acc;
        }
        try {
            const flow = (0, loader_1.deserializeFlow)((0, fs_1.readFileSync)(file.fullPath, "utf8"), file.fullPath);
            const relativePath = (0, path_1.relative)((0, path_1.join)(fileRoot, ".."), file.fullPath);
            acc[relativePath] ?? (acc[relativePath] = []);
            const importableNode = (0, core_1.visualNodeToImportableEditorNode)(flow.node, {
                type: "file",
                data: file.fullPath,
            });
            acc[relativePath].push(importableNode);
            return acc;
        }
        catch (e) {
            allErrors.push({
                path: file.fullPath,
                message: e instanceof Error ? e.message : String(e),
            });
            console.error(`Skipping corrupt flow at ${file.fullPath}, error: ${e}`);
            return acc;
        }
    }, {});
    const depNodesFlat = Object.values(depsNodes).flat();
    const localNodesFlat = Object.values(localNodes).flat();
    const builtInStdLibFlat = Object.values(builtInStdLib).flat();
    return {
        nodes: [...builtInStdLibFlat, ...depNodesFlat, ...localNodesFlat],
        errors: allErrors,
    };
}
function getLocalFlydeFiles(rootPath) {
    const structure = (0, scan_folders_structure_1.scanFolderStructure)(rootPath);
    const localFlydeFiles = [];
    const queue = [...structure];
    while (queue.length) {
        const item = queue.pop();
        if (item && 'isFolder' in item && item.isFolder === true) {
            queue.push(...('children' in item ? item.children : []));
        }
        else if (item && 'isFlyde' in item && (item.isFlyde || ('isFlydeCode' in item && item.isFlydeCode))) {
            localFlydeFiles.push(item);
        }
    }
    return localFlydeFiles;
}
//# sourceMappingURL=scan-importable-nodes.js.map