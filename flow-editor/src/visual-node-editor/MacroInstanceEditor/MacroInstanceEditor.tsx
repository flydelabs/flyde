import { Button, DialogTitle, useAiCompletion } from "@flyde/ui";
import { Dialog, DialogContent, DialogHeader } from "@flyde/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flyde/ui";
import { Alert, AlertDescription, AlertTitle, Info, GitFork } from "@flyde/ui";

import {
  EditorVisualNode,
  MacroNodeDefinition,
  ResolvedMacroNodeInstance,
  isMacroNodeDefinition,
} from "@flyde/core";

import { ErrorBoundary } from "react-error-boundary";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { loadMacroEditor } from "./macroEditorLoader";
import { usePrompt } from "../../flow-editor/ports";
import { useDependenciesContext } from "../../flow-editor/DependenciesContext";
import { Loader } from "../../lib/loader";
import { InstanceIcon } from "../instance-view/InstanceIcon";

export interface MacroInstanceEditorProps {
  ins: ResolvedMacroNodeInstance;
  editorNode: EditorVisualNode;
  onCancel: () => void;
  onSubmit: (value: any) => void;
  onSwitchToSiblingMacro: (newMacro: MacroNodeDefinition<any>) => void;
}

export const MacroInstanceEditor: React.FC<MacroInstanceEditorProps> = (
  props
) => {
  const { ins, onCancel, editorNode } = props;

  const { onRequestSiblingNodes, onForkNode } = useDependenciesContext();

  const [macroSiblings, setMacroSiblings] = useState<
    MacroNodeDefinition<any>[]
  >([]);

  const _onForkNode = useCallback(
    (node: MacroNodeDefinition<any>) => {
      onForkNode({ node });
      onCancel();
    },
    [onForkNode, onCancel]
  );

  const macro: MacroNodeDefinition<any> = useMemo(() => {
    const macro = editorNode.instances.find((_ins) => _ins.id === ins.id)?.node;
    if (macro && !isMacroNodeDefinition(macro)) {
      throw new Error(`Macro ${ins.macroId} not found `);
    }
    return macro as any as MacroNodeDefinition<any>;
  }, [editorNode.instances, ins.id, ins.macroId]);

  useEffect(() => {
    if (macro) {
      onRequestSiblingNodes(macro).then(setMacroSiblings);
    }
  }, [macro, onRequestSiblingNodes]);

  const [macroData, setMacroData] = React.useState<any>(ins.macroData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  const handleMacroDataChange = useCallback((newData: any) => {
    setMacroData(newData);
    setHasUnsavedChanges(true);
  }, []);

  const handleSubmit = useCallback(() => {
    props.onSubmit(macroData);
    setHasUnsavedChanges(false);
  }, [props, macroData]);

  const handleCancel = useCallback(() => {
    if (!hasUnsavedChanges) {
      onCancel();
      return;
    }
  }, [hasUnsavedChanges, onCancel]);

  const EditorComp = useMemo(() => {
    return loadMacroEditor(macro as any as MacroNodeDefinition<any>);
  }, [macro]);

  const prompt = usePrompt();

  const aiCompletion = useAiCompletion();

  if (!macro) {
    return (
      <Dialog open={true}>
        <DialogContent className="max-h-[90vh]">
          <Loader />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={handleCancel} modal={false}>
      <DialogContent
        className="flex flex-col max-h-[90vh] p-0"
        noInteractOutside={hasUnsavedChanges}
      >
        <DialogHeader className="flex flex-row items-center py-2 px-4 border-b border-gray-200 dark:border-gray-800 space-y-0">
          <InstanceIcon
            icon={macro.defaultStyle?.icon}
            className="h-5 w-5 mr-2 flex-shrink-0"
          />
          <DialogTitle className="text-base font-medium m-0">
            {macro.displayName ?? macro.id}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex-none">
            {onForkNode && (
              <div className="flex justify-end mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => _onForkNode(macro)}
                >
                  <GitFork className="mr-2 h-4 w-4" />
                  Fork
                </Button>
              </div>
            )}

            {macroSiblings.length > 1 && (
              <Select
                value={macro.id}
                onValueChange={(value) => {
                  const selectedMacro = macroSiblings.find(
                    (m) => m.id === value
                  );
                  if (selectedMacro) {
                    props.onSwitchToSiblingMacro(selectedMacro);
                  }
                }}
              >
                <SelectTrigger className="w-full mb-3">
                  <SelectValue>{macro.displayName ?? macro.id}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {macroSiblings.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.displayName || item.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {macro.description && (
              <Alert className="mb-3">
                <Info className="h-4 w-4" />
                <AlertTitle>{macro.displayName ?? macro.id}</AlertTitle>
                <AlertDescription>{macro.description}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 mb-3">
            <ErrorBoundary
              fallback={
                <div className="flex items-center gap-2">
                  <span>Error loading macro editor</span>
                  <Button
                    variant="outline"
                    onClick={() => setMacroData(macro.defaultData)}
                  >
                    Reset to default
                  </Button>
                </div>
              }
            >
              <EditorComp
                value={macroData}
                onChange={handleMacroDataChange}
                prompt={prompt}
                createAiCompletion={aiCompletion.createCompletion}
              />
            </ErrorBoundary>
          </div>
        </div>

        <div className="flex justify-end gap-2 py-2 px-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
