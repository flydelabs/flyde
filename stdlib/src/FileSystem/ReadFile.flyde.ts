import { InternalCodeNode } from "@flyde/core";
import * as fs from "fs";

export const ReadFile: InternalCodeNode = {
  id: "Read File",
  icon: "fa-file",
  namespace: "File System",
  description: "Reads a file from the file system",
  inputs: {
    path: { description: "Path to the file" },
    encoding: {
      description: "Encoding of the file",
      mode: "optional",
    },
  },
  outputs: { contents: { description: "Contents of the file" } },
  run: async ({ path, encoding }, { contents }) => {
    return contents.next(await fs.promises.readFile(path, encoding));
  },
};
