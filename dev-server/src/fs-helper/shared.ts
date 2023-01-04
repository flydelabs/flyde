export type FileOrFolderBase = {
  name: string;
  fullPath: string;
  relativePath: string;
};
export type File = FileOrFolderBase & {
  isFolder: false;
  isFlyde: boolean;
  isFlydeCode: boolean;
};
export type FileOrFolder = File | Folder;
export type Folder = FileOrFolderBase & {
  isFolder: true;
  children: Array<FileOrFolder>;
};
export type FlydeFile = File & { isFlyde: true };

export type FolderStructure = Array<FileOrFolder>;
