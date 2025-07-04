import { useState, useCallback, useMemo, useEffect } from "react";
import { Editor, useMonaco, OnMount } from "@monaco-editor/react";
import { NodeOrConfigurableDefinition } from "@flyde/core";
import { configureMonaco } from "../../lib/customCodeNode/configureMonaco";
import { useConfirm } from "../../flow-editor/ports/ports";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui";
import { Button, HotkeyIndication } from "../../ui";
import { Alert, AlertDescription, AlertTitle } from "../../ui";
import { useToast } from "../../ui";

interface CustomNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (code: string) => Promise<void>;
  forkMode?: { node: NodeOrConfigurableDefinition; initialCode: string };
}

const defaultContent = `
import type { CodeNode } from "@flyde/core";

/*
 Feel free to change the content of this file to experiment with the code nodes
 You can then import any exported node here from your other visual nodes.
 
 Full API reference: https://www.flyde.dev/docs/custom-nodes/
 */

const node: CodeNode = {
  id: "Add",
  displayName: "Add",
  icon: "fa-plus",
  description: "Emits the sum of two numbers",
  inputs: {
    n1: { description: "First number to add" },
    n2: { description: "Second number to add" },
  },
  outputs: { sum: { description: "The sum of n1 and n2" } },
  run: ({ n1, n2 }, { sum }) => sum.next(n1 + n2),
};

export default node;
`;

export function CustomNodeModal({
  isOpen,
  onClose,
  onSave,
  forkMode,
}: CustomNodeModalProps) {
  const confirm = useConfirm();
  const { toast } = useToast();
  const [code, setCode] = useState<string>(
    forkMode?.initialCode || defaultContent
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleEditorChange = useCallback((value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);
    setHasChanges(true);
  }, []);

  const handleClose = useCallback(async () => {
    if (
      !hasChanges ||
      (await confirm(
        "You have unsaved changes. Are you sure you want to close?"
      ))
    ) {
      onClose();
    }
  }, [hasChanges, onClose, confirm]);

  const editorOptions = useMemo(() => {
    return {
      minimap: { enabled: false },
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(code);
      onClose(); // Close the modal only after successful save
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Saving Node",
        description: error instanceof Error ? error.message : "Failed to save custom node",
      });
      console.error("Error saving custom node:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      configureMonaco(monaco);
    }
  }, [monaco]);

  // Monaco editor onMount handler to add custom commands
  const handleEditorDidMount: OnMount = (editor) => {
    if (monaco?.KeyMod && monaco?.KeyCode) {
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          handleSave();
        }
      );
    }

    // Focus the editor when it mounts
    editor.focus();
  };

  // Additional keyboard handler for when focus is outside the editor
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl" onKeyDown={handleKeyDown} tabIndex={0}>
        <DialogHeader>
          <DialogTitle>
            {forkMode ? "Fork Custom Node" : "Create Custom Node"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {forkMode && (
            <Alert>
              <AlertDescription>
                You are forking a new custom code node from{" "}
                {forkMode.node.displayName || forkMode.node.id}
              </AlertDescription>
            </Alert>
          )}
          <Editor
            height="400px"
            defaultLanguage="typescript"
            value={code}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={editorOptions}
            loading={<div>Loading editor...</div>}
            onMount={handleEditorDidMount}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            {isSaving ? "Saving..." : "Save"}
            <HotkeyIndication hotkey="cmd+enter" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
