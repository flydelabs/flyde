"use client";

import "@flyde/editor/src/index.scss";
import {
  DebuggerContextData,
  DebuggerContextProvider,
  FlowEditor,
  PortsContext,
  EditorPorts,
  defaultPorts,
  FlowEditorState,
  createRuntimePlayer,
  FlydeFlowEditorProps,
} from "@flyde/editor";
import React, { useMemo, forwardRef, useState } from "react";
import { createRuntimeClientDebugger } from "./createRuntimePlayerDebugger";
import { createHistoryPlayer } from "./createHistoryPlayer";
import { getBrowserSafeNodesLibraryData } from "../lib/browserNodesLibrary";
import { resolveEditorInstance } from "@flyde/loader/browser";
import { websiteNodesFinder } from "./nodesFinder";
import { CodeNodeInstance, isVisualNodeInstance, codeNodeToImportableEditorNode, configurableValue, extractInputsFromValue, replaceInputsInValue } from "@flyde/core";
import { SecretManager, SecretStorage } from "../lib/secrets";
import { SecretSaveDialog } from "./SecretSaveDialog";
import { customCodeNodeFromCode } from "@flyde/core/dist/misc/custom-code-node-from-code";
import { PlaygroundFile } from "./PlaygroundSidebar";
import { getNodeSource } from "../lib/generated/node-sources";

// Singleton players - shared across all instances
const historyPlayer = createHistoryPlayer();
const runtimePlayer = createRuntimePlayer();

export interface FlydeEditorWithDebuggerProps {
  state: FlowEditorState;
  onChangeEditorState: FlydeFlowEditorProps['onChangeEditorState'];
  darkMode?: boolean;
  requireModifierForZoom?: boolean;
  initialPadding?: [number, number];
  className?: string;
  customNodes?: any[];
  secretManager?: SecretManager;
  fileContents?: PlaygroundFile[];
  onContentChange?: (hasChanges: boolean) => void;
  onFilesChange?: (files: PlaygroundFile[]) => void;
}

export const FlydeEditorWithDebugger = forwardRef<any, FlydeEditorWithDebuggerProps>(({
  state,
  onChangeEditorState,
  darkMode = true,
  requireModifierForZoom = true,
  initialPadding,
  customNodes = [],
  secretManager,
  fileContents = [],
  onContentChange,
  onFilesChange,
}, ref) => {
  const [secretDialogState, setSecretDialogState] = useState<{
    isOpen: boolean;
    key: string;
    value: string;
    resolve?: (secrets: string[]) => void;
  }>({
    isOpen: false,
    key: '',
    value: '',
  });

  // Create debugger context with runtime and history players
  const debuggerContextValue = useMemo<DebuggerContextData>(() => {
    return {
      onRequestHistory: (...args) => historyPlayer.requestHistory(...args),
      debuggerClient: {
        onBatchedEvents: () => () => { }, // noop unsubscribe function
      },
    };
  }, []);

  // Create a custom node finder that includes playground custom nodes
  const customNodesFinder = useMemo(() => {
    return (instance: any) => {
      const { type, source, nodeId } = instance;
      
      // First try to find in custom nodes from playground
      if (type === "code" && source?.type === "file") {
        const customNode = customNodes.find(node => node.id === nodeId);
        if (customNode) {
          console.log("Found custom node:", nodeId, customNode);
          return customNode;
        }
      }
      
      // Fallback to the website nodes finder for standard nodes
      return websiteNodesFinder(instance);
    };
  }, [customNodes]);

  // Create ports context with browser-safe implementations
  const portsContextValue = useMemo<EditorPorts>(() => {
    return {
      ...defaultPorts,
      getLibraryData: async () => {
        console.log("getLibraryData", customNodes);
        return getBrowserSafeNodesLibraryData(customNodes);
      },
      resolveInstance: async ({ instance }) => {
        try {
          // Visual node instances don't need resolution, they're already resolved
          if (isVisualNodeInstance(instance)) {
            throw new Error("Visual node instances cannot be resolved with resolveInstance");
          }

          // Use the custom node finder that includes playground custom nodes
          const editorInstance = resolveEditorInstance(instance as CodeNodeInstance, customNodesFinder);
          return editorInstance;
        } catch (error) {
          console.error("Error resolving instance:", instance, error);
          throw error;
        }
      },
      getAvailableSecrets: async () => {
        if (!secretManager) {
          return [];
        }
        return secretManager.getAvailableSecrets();
      },
      addNewSecret: async ({ key, value }) => {
        if (!secretManager) {
          return [];
        }
        
        // Show dialog and wait for user choice
        return new Promise<string[]>((resolve) => {
          setSecretDialogState({
            isOpen: true,
            key,
            value,
            resolve,
          });
        });
      },
      onRequestNodeSource: async ({ node }) => {
        // For custom nodes in the playground, read the source directly from files
        if (customNodes.some(n => n.id === node.id)) {
          const customNode = customNodes.find(n => n.id === node.id);
          return customNode?.sourceCode || '';
        }
        
        // For standard library nodes, check bundled sources first
        const bundledSource = getNodeSource(node.id);
        if (bundledSource) {
          return bundledSource;
        }
        // Fallback: Generate a template that can be forked
        const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '');
        const inputs = (node as any).inputs || {};
        const outputs = (node as any).outputs || {};
        return `import type { CodeNode } from "@flyde/core";

export const ${nodeId}Fork: CodeNode = {
  id: "${nodeId}Fork",
  inputs: ${JSON.stringify(inputs, null, 2)},
  outputs: ${JSON.stringify(outputs, null, 2)},
  run: (inputs, outputs) => {
    // TODO: Implement the forked node logic based on original ${node.id}
    ${Object.keys(outputs).map(key => 
      `// outputs.${key}.next(someValue);`
    ).join('\n    ')}
  }
};`;
      },
      onCreateCustomNode: async ({ code }) => {
        try {
          // Parse the custom node from code
          const customNode = customCodeNodeFromCode(code, undefined, {
            "@flyde/core": {
              configurableValue: configurableValue,
              extractInputsFromValue: extractInputsFromValue,
              replaceInputsInValue: replaceInputsInValue,
            },
          });
          
          // Add sourceCode to the node
          customNode.sourceCode = code;
          
          // Convert to importable editor node
          const editorNode = codeNodeToImportableEditorNode(customNode, {
            type: "file",
            data: `${customNode.id}.flyde.ts`,
          });
          
          // Update custom nodes list
          if (onContentChange) {
            // Trigger parent to update files
            const newFile: PlaygroundFile = {
              name: `${customNode.id}.flyde.ts`,
              type: 'ts',
              content: code
            };
            onFilesChange?.([...fileContents, newFile]);
          }
          
          return editorNode;
        } catch (error) {
          console.error("Error creating custom node:", error);
          throw error;
        }
      },
    };
  }, [customNodes, customNodesFinder, secretManager, fileContents, onContentChange, onFilesChange]);

  // Create a key that changes when custom nodes change to force complete re-mount
  const editorKey = useMemo(() => {
    return `editor-${customNodes.map(n => n.id).sort().join('-')}`;
  }, [customNodes]);

  const handleSaveSecret = (storage: SecretStorage) => {
    if (secretManager && secretDialogState.key && secretDialogState.value) {
      secretManager.setSecret(secretDialogState.key, secretDialogState.value, storage);
      const secrets = secretManager.getAvailableSecrets();
      
      // Resolve the promise with updated secrets
      if (secretDialogState.resolve) {
        secretDialogState.resolve(secrets);
      }
    }
    
    setSecretDialogState({
      isOpen: false,
      key: '',
      value: '',
      resolve: undefined,
    });
  };

  const handleCancelSecret = () => {
    // Resolve with current secrets without saving
    if (secretDialogState.resolve && secretManager) {
      secretDialogState.resolve(secretManager.getAvailableSecrets());
    }
    
    setSecretDialogState({
      isOpen: false,
      key: '',
      value: '',
      resolve: undefined,
    });
  };

  return (
    <>
      <PortsContext.Provider value={portsContextValue}>
        <DebuggerContextProvider value={debuggerContextValue}>
          <FlowEditor
            key={editorKey}
            ref={ref}
            state={state}
            onChangeEditorState={onChangeEditorState}
            initialPadding={initialPadding}
            darkMode={darkMode}
            requireModifierForZoom={requireModifierForZoom}
          />
        </DebuggerContextProvider>
      </PortsContext.Provider>
      
      <SecretSaveDialog
        isOpen={secretDialogState.isOpen}
        secretKey={secretDialogState.key}
        onSave={handleSaveSecret}
        onCancel={handleCancelSecret}
      />
    </>
  );
});

FlydeEditorWithDebugger.displayName = 'FlydeEditorWithDebugger';

// Export the singleton players for external use (e.g., for flow execution)
export { historyPlayer, runtimePlayer, createRuntimeClientDebugger };