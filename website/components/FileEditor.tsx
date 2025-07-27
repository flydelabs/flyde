"use client";

import React, { useState, useEffect, useCallback, SetStateAction, useMemo } from 'react';
import { MonacoCodeEditor } from './MonacoCodeEditor';
import { FlydeEditorWithDebugger } from './FlydeEditorWithDebugger';
import { FlowEditorState, defaultBoardData } from '@flyde/editor';
import { resolveEditorNode } from '@flyde/loader/browser';
import { websiteNodesFinder } from './nodesFinder';

import { SecretManager } from '../lib/secrets';
import { PlaygroundFile } from './PlaygroundSidebar';

export interface FileEditorProps {
  fileName: string;
  fileContent: string;
  fileType: 'typescript' | 'flyde' | 'json';
  isActive: boolean;
  selectedExample?: string;
  customNodes: any[];
  secretManager: SecretManager;
  fileContents?: PlaygroundFile[];
  onContentChange: (fileName: string, newContent: string) => void;
  onFilesChange?: (files: PlaygroundFile[]) => void;
}

// Individual file editor that maintains its own state
export const FileEditor: React.FC<FileEditorProps> = ({
  fileName,
  fileContent,
  fileType,
  isActive,
  selectedExample,
  customNodes,
  secretManager,
  fileContents = [],
  onContentChange,
  onFilesChange
}) => {
  // Each Flyde file gets its own persistent editor state
  const [flydeEditorState, setFlydeEditorState] = useState<FlowEditorState | null>(null);
  // Track if we're updating from the editor to prevent loops
  const [isUpdatingFromEditor, setIsUpdatingFromEditor] = useState(false);

  // Create a runtime node finder that includes custom playground nodes
  const runtimeNodeFinder = useMemo(() => {
    return (instance: any) => {
      const { type, source, nodeId } = instance;

      // First try to find in custom nodes from playground
      if (type === "code" && (
        (source?.type === "file") ||
        (source?.type === "package" && source?.data === "playground")
      )) {
        const customNode = customNodes.find(node => node.id === nodeId);
        if (customNode) {
          console.log("Runtime resolving custom node:", nodeId, customNode);
          return customNode;
        }
      }
      // Fallback to the website nodes finder for standard nodes
      return websiteNodesFinder(instance);
    };
  }, [customNodes]);

  // Store the raw flow data to re-resolve when custom nodes change
  const [rawFlowData, setRawFlowData] = useState<any>(null);

  // Initialize raw flow data
  useEffect(() => {
    console.log('[FileEditor] Raw flow data effect - isUpdatingFromEditor:', isUpdatingFromEditor, 'fileContent length:', fileContent.length);
    if (fileType === 'flyde' && !isUpdatingFromEditor) {
      try {
        // Everything is now JSON format
        const flowData = JSON.parse(fileContent);
        console.log('[FileEditor] Parsed JSON flow from file content');
        setRawFlowData(flowData);
      } catch (e) {
        console.error("[FileEditor] Failed to parse flow:", e);
        setRawFlowData(null);
      }
    } else if (isUpdatingFromEditor) {
      console.log('[FileEditor] Skipping raw flow data update - updating from editor');
    }
  }, [fileName, fileType, selectedExample, fileContent, isUpdatingFromEditor]);

  // Resolve flow whenever raw flow data or custom nodes change
  useEffect(() => {
    console.log('[FileEditor] Resolve flow effect - isUpdatingFromEditor:', isUpdatingFromEditor, 'hasRawFlowData:', !!rawFlowData);
    if (fileType === 'flyde' && rawFlowData && runtimeNodeFinder && !isUpdatingFromEditor) {
      try {
        console.log("[FileEditor] Re-resolving flow with custom nodes:", customNodes.length);
        const resolvedEditorNode = resolveEditorNode(rawFlowData, runtimeNodeFinder);

        setFlydeEditorState(prev => ({
          flow: {
            node: resolvedEditorNode,
          },
          boardData: prev?.boardData || defaultBoardData // Preserve existing board data
        }));
      } catch (e) {
        console.error("Failed to resolve flow:", e);
        setFlydeEditorState(null);
      }
    }
  }, [rawFlowData, runtimeNodeFinder, fileType, customNodes, isUpdatingFromEditor]);

  const handleFlydeStateChange = useCallback((newState: SetStateAction<FlowEditorState>) => {
    if (fileType === 'flyde') {
      setFlydeEditorState(prev => {
        const updatedState = typeof newState === 'function' ? newState(prev!) : newState;
        // Only sync if the flow actually changed (not just board data like mouse position)
        if (updatedState && prev && updatedState.flow.node !== prev.flow.node) {
          console.log('[FileEditor] Flow actually changed, syncing...');
          console.log('[FileEditor] Old instances count:', prev.flow.node.instances?.length || 0);
          console.log('[FileEditor] New instances count:', updatedState.flow.node.instances?.length || 0);

          setIsUpdatingFromEditor(true);

          const flowData = updatedState.flow.node;
          const serializedFlow = JSON.stringify(flowData, null, 2);

          console.log('[FileEditor] Serialized flow preview:', serializedFlow.substring(0, 200) + '...');

          // Update the file content
          onContentChange(fileName, serializedFlow);

          // Update the raw flow data to match what's in the editor
          setRawFlowData(flowData);

          // Reset flag after a brief delay to allow the update to propagate
          setTimeout(() => {
            console.log('[FileEditor] Resetting isUpdatingFromEditor flag');
            setIsUpdatingFromEditor(false);
          }, 100);
        }
        return updatedState;
      });
    }
  }, [fileType, fileName, onContentChange]);


  const handleCodeChange = useCallback((newCode: string) => {
    onContentChange(fileName, newCode || '');
  }, [fileName, onContentChange]);

  // Only render when active to save resources but keep state
  if (!isActive) {
    return null;
  }

  if (fileType === 'flyde') {
    if (!flydeEditorState) {
      return (
        <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
          <div className="text-center">
            {rawFlowData === null ? (
              <>
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-xl mb-2">Invalid Flow Format</p>
                <p className="text-gray-400">Unable to parse the flow file</p>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p>Loading flow...</p>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <FlydeEditorWithDebugger
        state={flydeEditorState}
        onChangeEditorState={handleFlydeStateChange}
        darkMode={true}
        requireModifierForZoom={true}
        customNodes={customNodes}
        secretManager={secretManager}
        fileContents={fileContents}
        onContentChange={(hasChanges) => {
          // Propagate content change notification
          console.log('FileEditor content changed:', hasChanges);
        }}
        onFilesChange={onFilesChange}
      />
    );
  } else {
    return (
      <MonacoCodeEditor
        code={fileContent}
        language="typescript"
        readOnly={false}
        filename={fileName}
        onChange={handleCodeChange}
      />
    );
  }
};