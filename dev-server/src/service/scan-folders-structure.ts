import { readdirSync, lstatSync } from "fs";
import { join, relative } from "path";
import { defaultScanFilter } from "../fs-helper/default-scan-filter";
import { FolderStructure } from "../fs-helper/shared";

export const scanFolderStructure = (path: string, root: string = path, maxDepth = 7, filter = defaultScanFilter): FolderStructure => {
    const files = readdirSync(path);

    let res: FolderStructure = [];
    for (const file of files) {
        const filePath = join(path, file);
        const stats = lstatSync(filePath);

        if (filter(file, path)) {
            if (stats.isDirectory() && maxDepth > 0) {
                res.push({
                    name: file,
                    children: scanFolderStructure(filePath, root, maxDepth - 1, filter),
                    isFolder: true,
                    fullPath: filePath,
                    relativePath: relative(root, filePath)
                });
            } else {
                res.push({
                    name: file,
                    isFolder: false,
                    fullPath: filePath,
                    relativePath: relative(root, filePath),
                    isFlyde: file.endsWith('.flyde'),
                    isFlydeCode: file.endsWith('.flyde.js') || file.endsWith('.flyde.ts')
                });
            }
        }
    }
    return res;
}