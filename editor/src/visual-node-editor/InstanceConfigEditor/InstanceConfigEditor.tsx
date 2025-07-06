import { Button, DialogTitle, useAiCompletion } from "../../ui";
import { Dialog, DialogContent, DialogHeader } from "../../ui";


import {
  EditorCodeNodeInstance,
  EditorNodeInstance,
  EditorVisualNode,
} from "@flyde/core";

import { ErrorBoundary } from "react-error-boundary";
import React, { useCallback, useMemo, useEffect } from "react";
import { loadConfigEditorComponent } from "./loadConfigEditorComponent";
import { usePorts } from "../../flow-editor/ports";
import { InstanceIcon } from "../instance-view/InstanceIcon";
import { HotkeyIndication } from "../../ui";
import { Loader } from "../../lib/loader";

export interface InstanceConfigEditorProps {
  ins: EditorCodeNodeInstance;
  editorNode: EditorVisualNode;
  onCancel: () => void;
  onSubmit: (value: any) => Promise<void>;
  onFork: (ins: EditorNodeInstance) => void;
  // onSwitchToSiblingMacro: (newMacro: MacroNodeDefinition<any>) => void;
}

export const InstanceConfigEditor: React.FC<InstanceConfigEditorProps> = (
  props
) => {
  const { ins, onCancel, onFork } = props;
  const [isLoading, setIsLoading] = React.useState(false);

  const _onFork = useCallback(() => {
    onCancel();
    onFork(ins);
  }, [onCancel, onFork, ins]);

  const [instanceConfig, setInstanceConfig] = React.useState<any>(
    ins.config ?? {}
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = React.useState(false);

  const handleMacroDataChange = useCallback((newData: any) => {
    setInstanceConfig(newData);
    setHasUnsavedChanges(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isLoading) return;

    setIsLoading(true);
    props.onSubmit(instanceConfig)
      .then(() => {
        setHasUnsavedChanges(false);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to save config:", error);
        setIsLoading(false);
      });
  }, [props, instanceConfig, isLoading]);

  const handleCancel = useCallback(() => {
    if (isLoading) return;
    if (!hasUnsavedChanges) {
      onCancel();
      return;
    }
    setShowUnsavedChangesDialog(true);
  }, [hasUnsavedChanges, onCancel, isLoading]);

  const handleCloseUnsavedChangesDialog = useCallback(() => {
    if (isLoading) return;
    setShowUnsavedChangesDialog(false);
  }, [isLoading]);

  const handleDiscardChanges = useCallback(() => {
    if (isLoading) return;
    setShowUnsavedChangesDialog(false);
    onCancel();
  }, [onCancel, isLoading]);

  const EditorComp = useMemo(() => {
    return loadConfigEditorComponent(ins);
  }, [ins.node]);

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, hasUnsavedChanges]);

  const ports = usePorts();

  const aiCompletion = useAiCompletion();

  const { node } = ins;

  return (
    <>
      <Dialog open={true} onOpenChange={handleCancel} modal={false}>
        <DialogContent
          className="flex flex-col max-h-[90vh] p-0"
          noInteractOutside={hasUnsavedChanges || isLoading}
        >
          <DialogHeader className="flex flex-row items-center py-2 px-4 border-b border-gray-200 dark:border-gray-800 space-y-0">
            <InstanceIcon
              icon={node.icon}
              className="h-5 w-5 mr-2 shrink-0"
            />
            <DialogTitle className="text-base font-medium m-0 truncate max-w-[85%] overflow-hidden">
              {node.displayName ?? node.id}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 pt-0">
            <div className="flex-none">
              {node.description && (
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500">{node.description}</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 mb-3">
              <ErrorBoundary
                fallback={
                  <div className="flex items-center gap-2">
                    <span>Error loading config editor</span>
                    <Button
                      variant="outline"
                      onClick={() => setInstanceConfig({})}
                    >
                      Reset to default
                    </Button>
                  </div>
                }
              >
                <EditorComp
                  value={instanceConfig}
                  onChange={handleMacroDataChange}
                  ports={ports}
                  nodeId={ins.nodeId}
                  insId={ins.id}
                  createAiCompletion={aiCompletion.createCompletion}
                />
              </ErrorBoundary>
            </div>
          </div>

          <div className="flex justify-between items-center py-2 px-4 border-t border-gray-200 dark:border-gray-800">

            <div className="text-xs text-gray-500 mr-1">
              <span className="inline-flex items-center mr-1">Need more customization?{" "}</span>
              <Button
                variant="link"
                size="xs"
                onClick={_onFork}
                className="p-0 h-auto text-xs inline-flex items-center"
                disabled={isLoading}
              >
                Fork
              </Button>
              {" "}this node
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    Saving <Loader minimal />
                  </>
                ) : (
                  <>
                    Save
                    <HotkeyIndication hotkey="cmd+enter" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedChangesDialog} onOpenChange={handleCloseUnsavedChangesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You have unsaved changes. Are you sure you want to exit without saving?
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={handleCloseUnsavedChangesDialog}>
              Continue Editing
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDiscardChanges}>
              Discard Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
