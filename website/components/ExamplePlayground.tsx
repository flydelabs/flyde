"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { EditorInterface, EditorTab } from "./EditorInterface";
import { PlaygroundSidebar, PlaygroundFile } from "./PlaygroundSidebar";
import { FileEditor } from "./FileEditor";
import { historyPlayer, runtimePlayer, createRuntimeClientDebugger } from "./FlydeEditorWithDebugger";
import { getExampleFiles } from "../lib/generated/playground-examples";
import { runPlayground, RuntimeStatus } from "../lib/transpilation";
import { customCodeNodeFromCode } from "@flyde/core/dist/misc/custom-code-node-from-code";
import { configurableValue, extractInputsFromValue, replaceInputsInValue } from "@flyde/core";
import { getSecretManager } from "../lib/secrets";

export interface ExamplePlaygroundProps {
  exampleId?: string;
  isActive: boolean;
  onContentChange?: (hasChanges: boolean) => void;
  onFilesChange?: (files: PlaygroundFile[]) => void;
  initialFiles?: PlaygroundFile[];
}

// Self-contained playground for a single example
export const ExamplePlayground: React.FC<ExamplePlaygroundProps> = ({
  exampleId,
  isActive,
  onContentChange,
  onFilesChange,
  initialFiles
}) => {
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<PlaygroundFile[]>([]);
  const [originalFileContents, setOriginalFileContents] = useState<PlaygroundFile[]>([]);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>({ type: "stopped" });
  const [consoleOutput, setConsoleOutput] = useState<Array<{ type: 'log' | 'error'; args: any[]; timestamp: number }>>([]);
  const [showConsole, setShowConsole] = useState(false);

  const stopExecutionRef = useRef<(() => void) | null>(null);
  const secretManager = useMemo(() => getSecretManager(), []);

  // Initialize files for this example
  React.useEffect(() => {
    let filesToUse: PlaygroundFile[] = [];

    if (initialFiles) {
      // Use provided initial files (for saved flows)
      filesToUse = initialFiles;
      console.log('[ExamplePlayground] Using provided initial files');
    } else if (exampleId) {
      // Load from example (for built-in examples)
      const exampleFiles = getExampleFiles(exampleId);
      filesToUse = exampleFiles.map(file => ({
        name: file.name,
        type: file.type,
        content: file.content
      }));
      console.log('[ExamplePlayground] Loading example files for:', exampleId);
    }

    // Only reset if we don't have files yet OR if this is truly different content
    if (fileContents.length === 0 || (filesToUse.length > 0 && fileContents[0]?.name !== filesToUse[0]?.name)) {
      setFileContents(filesToUse);
      setOriginalFileContents(filesToUse);
      setActiveFileName(filesToUse.length > 0 ? filesToUse[0].name : null);
      setConsoleOutput([]);
      setRuntimeStatus({ type: "stopped" });
    }
  }, [exampleId, initialFiles, fileContents]);

  // Check for file content changes
  const hasFileContentChanges = React.useMemo(() => {
    if (originalFileContents.length === 0) return false;

    return fileContents.some((file, index) => {
      const originalFile = originalFileContents[index];
      return originalFile && file.content !== originalFile.content;
    });
  }, [fileContents, originalFileContents]);

  // Notify parent of content changes
  React.useEffect(() => {
    if (onContentChange) {
      onContentChange(hasFileContentChanges);
    }
  }, [hasFileContentChanges, onContentChange]);

  // Send current files to parent whenever they change
  React.useEffect(() => {
    if (onFilesChange) {
      onFilesChange(fileContents);
    }
  }, [fileContents, onFilesChange]);

  // Extract custom nodes from .flyde.ts files
  const customNodes = useMemo(() => {
    const nodes: any[] = [];
    const customNodeFiles = fileContents.filter(file => file.name.endsWith('.flyde.ts'));
    const secrets = secretManager.getSecrets();

    customNodeFiles.forEach(file => {
      try {
        const node = customCodeNodeFromCode(file.content, undefined, {
          "@flyde/core": {
            configurableValue: configurableValue,
            extractInputsFromValue: extractInputsFromValue,
            replaceInputsInValue: replaceInputsInValue,
          },
        });

        if (node) {
          // Add sourceCode to the node for fork functionality
          node.sourceCode = file.content;
          nodes.push(node);
        }
      } catch (error) {
        console.warn(`Failed to parse custom node from ${file.name}:`, error);
      }
    });

    return nodes;
  }, [fileContents.filter(f => f.name.endsWith('.flyde.ts')).map(f => f.content).join('|||'), secretManager]);

  const handleFileSelect = useCallback((fileName: string) => {
    setActiveFileName(fileName);
  }, []);

  const handleNewFile = useCallback((newFile: PlaygroundFile) => {
    setFileContents(prev => [...prev, newFile]);
    setActiveFileName(newFile.name);
  }, []);

  const handleDeleteFile = useCallback((fileName: string) => {
    setFileContents(prev => prev.filter(f => f.name !== fileName));
    if (activeFileName === fileName) {
      const remainingFiles = fileContents.filter(f => f.name !== fileName);
      setActiveFileName(remainingFiles.length > 0 ? remainingFiles[0].name : null);
    }
  }, [activeFileName, fileContents]);

  const handleRenameFile = useCallback((oldName: string, newName: string) => {
    setFileContents(prev => prev.map(f =>
      f.name === oldName ? { ...f, name: newName } : f
    ));
    if (activeFileName === oldName) {
      setActiveFileName(newName);
    }
  }, [activeFileName]);

  const handleCodeChange = useCallback((fileName: string, newContent: string) => {
    setFileContents(prev => prev.map(f =>
      f.name === fileName ? { ...f, content: newContent } : f
    ));
  }, []);

  const handleRun = useCallback(async () => {
    if (runtimeStatus.type === "running") {
      return;
    }

    setConsoleOutput([]);
    setShowConsole(true);

    const localDebugger = createRuntimeClientDebugger(runtimePlayer, historyPlayer);
    runtimePlayer.start();

    try {
      const { promise, stop } = runPlayground({
        files: fileContents,
        onStatusChange: setRuntimeStatus,
        onOutput: (output) => {
          setConsoleOutput(prev => [...prev, { ...output, timestamp: Date.now() }]);
        },
        debugger: localDebugger,
        secrets: secretManager.getSecrets()
      });

      stopExecutionRef.current = stop;
      await promise;
    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      stopExecutionRef.current = null;
    }
  }, [fileContents, runtimeStatus]);

  const handleStop = useCallback(() => {
    if (stopExecutionRef.current) {
      stopExecutionRef.current();
      stopExecutionRef.current = null;
    }
  }, []);

  // Generate tabs
  const tabs: EditorTab[] = fileContents.map(file => ({
    id: file.name,
    name: file.name,
    modified: false, // TODO: Add modification tracking if needed
  }));

  // Render file editors
  const renderFileEditors = () => {
    if (fileContents.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select a file to start editing
        </div>
      );
    }

    return (
      <>
        {fileContents.map(file => (
          <FileEditor
            key={file.name}
            fileName={file.name}
            fileContent={file.content}
            fileType={file.type as 'typescript' | 'flyde' | 'json'}
            isActive={file.name === activeFileName}
            selectedExample={exampleId}
            customNodes={customNodes}
            secretManager={secretManager}
            fileContents={fileContents}
            onContentChange={handleCodeChange}
            onFilesChange={(files) => {
              setFileContents(files);
              if (onFilesChange) {
                onFilesChange(files);
              }
            }}
          />
        ))}
      </>
    );
  };

  // Only render when active
  if (!isActive) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex min-h-0">
        <PlaygroundSidebar
          files={fileContents}
          activeFile={activeFileName}
          onFileSelect={handleFileSelect}
          onNewFile={handleNewFile}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
        />

        <div className="flex-1 flex flex-col">
          <EditorInterface
            tabs={tabs}
            activeTabId={activeFileName || ''}
            onTabChange={handleFileSelect}
            onRun={handleRun}
            onStop={handleStop}
            isRunning={runtimeStatus.type === "running"}
            content={renderFileEditors()}
          />
        </div>
      </div>

      {/* Console Output */}
      {showConsole && (
        <div className="h-64 border-t border-[#3c3c3c] bg-[#1e1e1e] flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-[#3c3c3c]">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">Console</span>
              {runtimeStatus.type === "running" && (
                <div className="flex items-center gap-2 text-green-400 text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Running
                </div>
              )}
              {runtimeStatus.type === "error" && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  Error
                </div>
              )}
            </div>
            <button
              onClick={() => setShowConsole(false)}
              className="text-gray-400 hover:text-white px-2 py-1 text-xs"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 text-sm font-mono">
            {consoleOutput.length === 0 ? (
              <div className="text-gray-500">Console output will appear here...</div>
            ) : (
              consoleOutput.map((entry, index) => (
                <div key={index} className={`mb-1 ${entry.type === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                  <span className="text-gray-500 text-xs mr-2">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  {entry.args.map((arg, i) => (
                    <span key={i} className="mr-2">
                      {typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)}
                    </span>
                  ))}
                </div>
              ))
            )}

            {runtimeStatus.type === "error" && (
              <div className="text-red-400 mt-2 p-2 bg-red-900/20 rounded">
                Error: {runtimeStatus.error?.message || String(runtimeStatus.error)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};