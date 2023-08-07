import { CodeNode } from "@flyde/core";

import * as fs from "fs";

const namespace = "File System";

export const ReadFile: CodeNode = {
  id: "Read File",
  defaultStyle: {
    icon: "fa-file",
  },
  namespace,
  description: "Reads a file from the file system",
  inputs: {
    path: { description: "Path to the file" },
    encoding: {
      description: "Encoding of the file",
      mode: "optional",
      defaultValue: "utf8",
    },
  },
  outputs: { contents: { description: "Contents of the file" } },
  run: async ({ path, encoding }, { contents }) => {
    return contents.next(await fs.promises.readFile(path, encoding));
  },
};

export const WriteFile: CodeNode = {
  id: "Write File",
  defaultStyle: {
    icon: "fa-file",
  },
  namespace,
  description: "Writes a file to the file system",
  inputs: {
    path: { description: "Path to the file" },
    contents: { description: "Contents of the file" },
    encoding: {
      description: "Encoding of the file",
      mode: "optional",
      defaultValue: "utf8",
    },
  },
  outputs: {},
  run: ({ path, contents, encoding }) => {
    return fs.promises.writeFile(path, contents, encoding);
  },
};

export const AppendFile: CodeNode = {
  id: "Append File",
  defaultStyle: {
    icon: "fa-file",
  },
  namespace,
  description: "Appends a file to the file system",
  inputs: {
    path: { description: "Path to the file" },
    contents: { description: "Contents of the file" },
    encoding: {
      description: "Encoding of the file",
      mode: "optional",
      defaultValue: "utf8",
    },
  },
  outputs: {},
  run: ({ path, contents, encoding }) => {
    return fs.promises.appendFile(path, contents, encoding);
  },
};

export const DeleteFile: CodeNode = {
  id: "Delete File",
  defaultStyle: {
    icon: "fa-file",
  },
  namespace,
  description: "Deletes a file from the file system",
  inputs: { path: { description: "Path to the file" } },
  outputs: {},
  run: async ({ path }, {}) => {
    await fs.promises.unlink(path);
  },
};

export const Exists: CodeNode = {
  id: "Exists",
  defaultStyle: {
    icon: "fa-file",
  },
  namespace,
  description: "Checks if a file exists",
  inputs: { path: { description: "Path to the file" } },
  outputs: { exists: { description: "Whether the file exists" } },
  run: async ({ path }, { exists }) => {
    // check if file in path exists
    return exists.next(await fs.promises.access(path, fs.constants.F_OK));
  },
};
