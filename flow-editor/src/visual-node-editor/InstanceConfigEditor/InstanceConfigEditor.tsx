import { Button, DialogTitle, useAiCompletion } from "@flyde/ui";
import { Dialog, DialogContent, DialogHeader } from "@flyde/ui";

import { Alert, AlertDescription, AlertTitle, Info, GitFork } from "@flyde/ui";

import {
  CodeNodeInstance,
  EditorNodeInstance,
  EditorVisualNode,
} from "@flyde/core";

import { ErrorBoundary } from "react-error-boundary";
import React, { useCallback, useMemo } from "react";
import { loadConfigEditorComponent } from "./loadConfigEditorComponent";
import { usePrompt } from "../../flow-editor/ports";
import { Loader } from "../../lib/loader";
import { InstanceIcon } from "../instance-view/InstanceIcon";

export interface InstanceConfigEditorProps {
  ins: CodeNodeInstance;
  editorNode: EditorVisualNode;
  onCancel: () => void;
  onSubmit: (value: any) => void;
  // onSwitchToSiblingMacro: (newMacro: MacroNodeDefinition<any>) => void;
}

export const InstanceConfigEditor: React.FC<InstanceConfigEditorProps> = (
  props
) => {
  const { ins, onCancel, editorNode } = props;

  // const [macroSiblings] = useState<MacroNodeDefinition<any>[]>([]);

  const _onForkNode = useCallback(
    (node: EditorNodeInstance["node"]) => {
      onCancel();
      throw new Error("Not implemented");
    },
    [onCancel]
  );

  const nodeInstance: EditorNodeInstance = useMemo(() => {
    return editorNode.instances.find((_ins) => _ins.id === ins.id);
  }, [editorNode.instances, ins.id]);

  const [instanceConfig, setInstanceConfig] = React.useState<any>(
    (nodeInstance as any).config ?? {}
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  const handleMacroDataChange = useCallback((newData: any) => {
    setInstanceConfig(newData);
    setHasUnsavedChanges(true);
  }, []);

  const handleSubmit = useCallback(() => {
    props.onSubmit(instanceConfig);
    setHasUnsavedChanges(false);
  }, [props, instanceConfig]);

  const handleCancel = useCallback(() => {
    if (!hasUnsavedChanges) {
      onCancel();
      return;
    }
  }, [hasUnsavedChanges, onCancel]);

  const EditorComp = useMemo(() => {
    return loadConfigEditorComponent(nodeInstance);
  }, [nodeInstance]);

  const prompt = usePrompt();

  const aiCompletion = useAiCompletion();

  if (!nodeInstance || !nodeInstance.node) {
    return (
      <Dialog open={true}>
        <DialogContent className="max-h-[90vh]">
          <Loader />
        </DialogContent>
      </Dialog>
    );
  }
  const { node } = nodeInstance;

  return (
    <Dialog open={true} onOpenChange={handleCancel} modal={false}>
      <DialogContent
        className="flex flex-col max-h-[90vh] p-0"
        noInteractOutside={hasUnsavedChanges}
      >
        <DialogHeader className="flex flex-row items-center py-2 px-4 border-b border-gray-200 dark:border-gray-800 space-y-0">
          <InstanceIcon
            icon={node.icon}
            className="h-5 w-5 mr-2 flex-shrink-0"
          />
          <DialogTitle className="text-base font-medium m-0">
            {node.displayName ?? node.id}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex-none">
            {_onForkNode && (
              <div className="flex justify-end mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => _onForkNode(node)}
                >
                  <GitFork className="mr-2 h-4 w-4" />
                  Fork
                </Button>
              </div>
            )}

            {/* {macroSiblings.length > 1 && (
              <Select
                value={macro.id}
                onValueChange={(value) => {
                  const selectedMacro = macroSiblings.find(
                    (m) => m.id === value
                  );
                  if (selectedMacro) {
                    // props.onSwitchToSiblingMacro(selectedMacro);
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
            )} */}

            {node.description && (
              <Alert className="mb-3">
                <Info className="h-4 w-4" />
                <AlertTitle>{node.displayName ?? node.id}</AlertTitle>
                <AlertDescription>{node.description}</AlertDescription>
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
