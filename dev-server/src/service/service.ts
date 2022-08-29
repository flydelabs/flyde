import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { CustomPartRepo, ExposedFunctionality, FlydeFlow, GroupedPart, Project, Trigger } from "@flyde/core";
import { defaultScanFilter } from "../fs-helper/default-scan-filter";
import { findInFiles } from "../fs-helper/find-in-files";
import { scanFolderStructure } from "./scan-folders-structure";
import { deserializeFlow, serializeFlow } from '@flyde/runtime';

// const flowFilePath = join(__dirname, '../../invoices-example/src/flow.flyde');

export const createService = (root: string) => {

    const readFile = (filename: string) => {
        const path = join(root, filename);

        const contents = readFileSync(path, 'utf-8');
        try {
            return deserializeFlow(contents);
        } catch (e) {
            console.log('ERROR', e);
            return JSON.parse(contents);
        }
    }
    
    const saveFile = async (filename: string, data: FlydeFlow) => {
        const path = join(root, filename);

        const serializedYaml = serializeFlow(data);
        return writeFileSync(path, serializedYaml, 'utf-8');
        // return writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
    }

    const maybeParseInputs = (str: string) => {
        if (!str) {
            return undefined
        }
        try {
            return JSON.parse(str.replace(/'/g, '"'));
        } catch (e) {
            return undefined;
        }
    }

    const scanExposed = (dir: string): Promise<ExposedFunctionality[]> => {

        const pattern = /expose\(([a-zA-Z_\.\-\d]*),\s+['"]([^,]+)['"],?(.*)\)/i;

        return findInFiles(dir, pattern, defaultScanFilter)
        .then(results => {

            return results.map(result => {
                    return {
                        codeName: result.matches[1],
                        displayName: result.matches[2].replace(/['"](.*)['"]/, '$1'),
                        inputs: maybeParseInputs(result.matches[3]) || ['args'],
                        path: result.path,
                        line: result.line
                    };
                });
            });
    }

    return {
        readFile,
        saveFile,
        scanExposed,
        scanFolderStructure
    }
}

