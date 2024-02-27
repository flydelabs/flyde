import React, { useEffect } from "react";
import { AppFile, AppFileType } from "../AppView";
import { toFilename } from "@/lib/toFilename";
import { InfoTooltip } from "../InfoToolip";

export interface TabsProps {
  files: AppFile[];
  activeFile: AppFile;
  unsavedFiles: Set<AppFile>;
  onChangeActiveFile: (newActiveFile: AppFile) => void;
  onDeleteFile: (file: AppFile) => void;
  onRenameFile: (file: AppFile, newName: string) => void;
  onSetEditedFile: (file: AppFile) => void;
  editedFile?: AppFile;
}

export function fileId(file: AppFile) {
  return `${file.name}.${file.type}`;
}

export function fileEquals(file1?: AppFile, file2?: AppFile) {
  return (file1 && fileId(file1)) === (file2 && fileId(file2));
}

export default function Tabs({
  files,
  activeFile,
  unsavedFiles,
  onChangeActiveFile,
  onDeleteFile,
  onRenameFile,
  onSetEditedFile,
  editedFile,
}: TabsProps) {
  // const [editedFile, setEditedFile] = React.useState<AppFile>();

  const [editedFileName, setEditedFileName] = React.useState<string>(
    activeFile.name
  );

  useEffect(() => {
    if (editedFile) {
      setEditedFileName(editedFile.name);
    }
  }, [editedFile]);

  function deleteFile() {
    if (confirm("Are you sure you want to delete this file?")) {
      onDeleteFile(activeFile);
    }
  }

  function renameFile() {
    if (editedFileName === activeFile.name || editedFileName === "") {
      // setEditedFile(undefined);
      return;
    }

    const freeName = (name: string) => {
      return !files.some((file) => file.name === name);
    };

    if (freeName(editedFileName)) {
      onRenameFile(activeFile, editedFileName);
      return;
    }

    let i = 1;
    while (!freeName(`${editedFileName} (${i})`)) {
      i++;
    }
    onRenameFile(activeFile, `${editedFileName} (${i})`);
  }

  function fileLabel(file: AppFile) {
    return (
      <React.Fragment>
        {toFilename(file)}
        {unsavedFiles.has(file) ? "*" : ""}
        {file.type === AppFileType.ENTRY_POINT ? (
          <InfoTooltip
            className="ml-2"
            content="This is the entry point file that is ran when you click the 'Run' button. It showcases how Flyde flows can be loaded from existing code."
          />
        ) : null}
      </React.Fragment>
    );
  }

  return (
    <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
      <ul className="flex -mb-px  mt-1 flex-nowrap">
        {files.map((file) =>
          fileEquals(file, activeFile) ? (
            <li
              key={file.name + file.type}
              className="flex-none flex flex-row px-3 pt-2 border-b-2 border-blue-600"
            >
              {fileEquals(file, editedFile) ? (
                <React.Fragment>
                  <input
                    className="inline-block  text-blue-600  rounded-t-lg active dark:text-blue-500 dark:border-blue-500 w-full"
                    value={editedFileName}
                    size={editedFileName.length - 1}
                    onChange={(e) => setEditedFileName(e.target.value)}
                    onBlur={renameFile}
                    placeholder={file.name}
                    autoFocus
                  />
                  <span>.{file.type}</span>
                </React.Fragment>
              ) : (
                <span className="px-3 inline-block">
                  <a
                    href="#"
                    className="inline-block text-blue-600 rounded-t-lg active dark:text-blue-500 dark:border-blue-500"
                    aria-current="page"
                    onClick={() => onSetEditedFile(file)}
                  >
                    {fileLabel(file)}
                  </a>
                  {file.type !== AppFileType.ENTRY_POINT ? (
                    <button className="ml-2" onClick={deleteFile}>
                      x
                    </button>
                  ) : null}
                </span>
              )}
            </li>
          ) : (
            <li
              key={file.name + file.type}
              className="flex-none pr-2 flex-shrink-0"
            >
              <a
                href="#"
                className="inline-block py-2 px-3 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                onClick={() => onChangeActiveFile(file)}
              >
                {fileLabel(file)}
              </a>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
