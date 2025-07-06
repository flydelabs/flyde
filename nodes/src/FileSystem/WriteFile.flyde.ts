import { InternalCodeNode } from "@flyde/core";
import * as fs from "fs";

export const WriteFile: InternalCodeNode = {
  id: "Write File",
  icon: "fa-file",
  namespace: "File System",
  description: "Writes a file to the file system",
  inputs: {
    path: { description: "Path to the file" },
    contents: { description: "Contents of the file" },
    encoding: {
      description: "Encoding of the file",
      mode: "optional",
    },
  },
  outputs: {},
  run: ({ path, contents, encoding }) => {
    return fs.promises.writeFile(path, contents, encoding);
  },
};
