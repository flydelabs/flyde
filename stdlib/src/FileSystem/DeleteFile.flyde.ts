import { CodeNode } from "@flyde/core";
import * as fs from "fs";

export const DeleteFile: CodeNode = {
  id: "Delete File",
  defaultStyle: {
    icon: "fa-file",
  },
  namespace: "File System",
  description: "Deletes a file from the file system",
  inputs: { path: { description: "Path to the file" } },
  outputs: {},
  run: async ({ path }) => {
    await fs.promises.unlink(path);
  },
};
