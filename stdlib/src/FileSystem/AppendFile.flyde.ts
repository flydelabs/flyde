import { InternalCodeNode } from "@flyde/core";
import * as fs from "fs";

export const AppendFile: InternalCodeNode = {
  id: "Append File",
  icon: "fa-file",
  namespace: "File System",
  description: "Appends a file to the file system",
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
    return fs.promises.appendFile(path, contents, encoding);
  },
};
