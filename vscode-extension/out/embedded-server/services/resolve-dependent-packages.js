"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDependentPackages = resolveDependentPackages;
const core_1 = require("@flyde/core");
const loader_1 = require("@flyde/loader");
const fs_1 = require("fs");
async function resolveDependentPackages(rootPath, flydeDependencies) {
    return flydeDependencies.reduce((acc, pkgName) => {
        try {
            const paths = (0, loader_1.resolveImportablePaths)(rootPath, pkgName);
            const nodes = paths.reduce((acc, filePath) => {
                if ((0, loader_1.isCodeNodePath)(filePath)) {
                    const obj = (0, loader_1.resolveCodeNodeDependencies)(filePath).nodes.map(({ node: _node }) => {
                        return (0, core_1.codeNodeToImportableEditorNode)(_node, {
                            type: "package",
                            data: pkgName
                        });
                    });
                    return [...acc, ...obj];
                }
                try {
                    const flow = (0, loader_1.deserializeFlow)((0, fs_1.readFileSync)(filePath, "utf8"), filePath);
                    const importableNode = (0, core_1.visualNodeToImportableEditorNode)(flow.node, {
                        type: "package",
                        data: pkgName,
                    });
                    return { ...acc, [flow.node.id]: importableNode };
                }
                catch (e) {
                    console.error(`Skipping corrupt flow at ${filePath}, error: ${e}`);
                    return acc;
                }
            }, []);
            return { ...acc, [pkgName]: nodes };
        }
        catch (e) {
            console.log(`skipping invalid dependency ${pkgName}`);
            return acc;
        }
        // return acc;
    }, {});
}
//# sourceMappingURL=resolve-dependent-packages.js.map