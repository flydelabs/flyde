import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { FlydeFlow } from "@flyde/core";
import { defaultScanFilter } from "../fs-helper/default-scan-filter";
import { findInFiles } from "../fs-helper/find-in-files";
import { scanFolderStructure } from "./scan-folders-structure";
import { deserializeFlow, serializeFlow } from "@flyde/resolver";

// const flowFilePath = join(__dirname, '../../invoices-example/src/flow.flyde');

export const createService = (root: string) => {
  const readFile = (filename: string) => {
    console.log({ filename });

    const contents = readFileSync(filename, "utf-8");
    try {
      return deserializeFlow(contents, filename);
    } catch (e) {
      console.log("ERROR", e);
      return JSON.parse(contents);
    }
  };

  const saveFile = async (filename: string, data: FlydeFlow) => {
    const path = join(root, filename);

    const serializedYaml = serializeFlow(data);
    return writeFileSync(path, serializedYaml, "utf-8");
    // return writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
  };

  const maybeParseInputs = (str: string) => {
    if (!str) {
      return undefined;
    }
    try {
      return JSON.parse(str.replace(/'/g, '"'));
    } catch (e) {
      return undefined;
    }
  };

  return {
    readFile,
    saveFile,
    scanFolderStructure,
  };
};
