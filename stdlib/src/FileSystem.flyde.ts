import { partFromSimpleFunction } from "@flyde/core";

import * as fs from "fs";

const namespace = "File System";

export const ReadFile = partFromSimpleFunction({
  id: "Read File",
  icon: "fa-file",
  namespace,
  description: "Reads a file from the file system",
  inputs: [
    { name: "path", description: "Path to the file" },
    { name: "encoding", description: "Encoding of the file", mode: "optional" },
  ],
  output: { name: "contents", description: "Contents of the file" },
  fn: (path, encoding) => {
    return fs.promises.readFile(path, encoding);
  },
});

export const WriteFile = partFromSimpleFunction({
  id: "Write File",
  icon: "fa-file",
  namespace,
  description: "Writes a file to the file system",
  inputs: [
    { name: "path", description: "Path to the file" },
    { name: "contents", description: "Contents of the file" },
    { name: "encoding", description: "Encoding of the file", mode: "optional" },
  ],
  fn: (path, contents, encoding) => {
    return fs.promises.writeFile(path, contents, encoding);
  },
});

export const AppendFile = partFromSimpleFunction({
  id: "Append File",
  icon: "fa-file",
  namespace,
  description: "Appends a file to the file system",
  inputs: [
    { name: "path", description: "Path to the file" },
    { name: "contents", description: "Contents of the file" },
    { name: "encoding", description: "Encoding of the file", mode: "optional" },
  ],
  fn: (path, contents, encoding) => {
    return fs.promises.appendFile(path, contents, encoding);
  },
});

export const DeleteFile = partFromSimpleFunction({
  id: "Delete File",
  icon: "fa-file",
  namespace,
  description: "Deletes a file from the file system",
  inputs: [{ name: "path", description: "Path to the file" }],
  fn: (path) => {
    return fs.promises.unlink(path);
  },
});

export const Exists = partFromSimpleFunction({
  id: "Exists",
  icon: "fa-file",
  namespace,
  description: "Checks if a file exists",
  inputs: [{ name: "path", description: "Path to the file" }],
  output: { name: "exists", description: "Whether the file exists" },
  fn: (path) => {
    // check if file in path exists
    return fs.promises.access(path, fs.constants.F_OK);
  },
});
