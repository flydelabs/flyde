
import * as path from "path";
import { FlydeFlow, VisualNode } from "@flyde/core";

export interface FileMove {
    oldPath: string;
    newPath: string;
}

/**
 * Resolve a file's new location after one or more file/folder moves.
 */
function getMovedPath(
    filePath: string,
    moves: FileMove[]
): string {
    const absolutePath = path.resolve(filePath);

    for (const move of moves) {
        const oldPath = path.resolve(move.oldPath);
        const newPath = path.resolve(move.newPath);

        const relative = path.relative(oldPath, absolutePath);

        // Match the exact file or a file inside a moved folder.
        if (
            relative === "" ||
            (relative !== ".." &&
                !relative.startsWith(".." + path.sep) &&
                !path.isAbsolute(relative))
        ) {
            return path.resolve(newPath, relative);
        }
    }

    return absolutePath;
}

/**
 * Update file-backed node references inside a Flyde flow.
 *
 * Returns true when at least one reference changed.
 */
export function updateMovedFileReferences(
    flow: FlydeFlow,
    flowFilePath: string,
    moves: FileMove[]
): boolean {
    let changed = false;

    const oldFlowPath = path.resolve(flowFilePath);
    const newFlowPath = getMovedPath(oldFlowPath, moves);

    function updateNode(node: VisualNode): void {
        for (const instance of node.instances) {
            const source = instance.source;

            if (!source) {
                continue;
            }

            if (
                source.type === "file" &&
                typeof source.data === "string"
            ) {
                const wasAbsolute = path.isAbsolute(source.data);

                const oldTarget = path.resolve(
                    path.dirname(oldFlowPath),
                    source.data
                );

                const newTarget = getMovedPath(oldTarget, moves);

                if (
                    oldTarget !== newTarget ||
                    oldFlowPath !== newFlowPath
                ) {
                    let updatedReference: string;

                    if (wasAbsolute) {
                        updatedReference = newTarget;
                    } else {
                        updatedReference = path.relative(
                            path.dirname(newFlowPath),
                            newTarget
                        );

                        // Keep relative imports explicitly relative.
                        if (
                            !updatedReference.startsWith(".")
                        ) {
                            updatedReference = "./" + updatedReference;
                        }

                        // Flyde references use forward slashes.
                        updatedReference =
                            updatedReference.replace(/\\/g, "/");
                    }

                    if (source.data !== updatedReference) {
                        source.data = updatedReference;
                        changed = true;
                    }
                }
            }

            // Also handle nested inline visual nodes.
            if (
                source.type === "inline" &&
                source.data &&
                typeof source.data === "object"
            ) {
                updateNode(source.data as VisualNode);
            }
        }
    }

    updateNode(flow.node);

    return changed;
}