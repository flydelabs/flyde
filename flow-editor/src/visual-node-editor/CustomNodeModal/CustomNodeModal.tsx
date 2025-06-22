import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Editor, useMonaco, OnMount, DiffEditor } from "@monaco-editor/react";
import { NodeOrMacroDefinition } from "@flyde/core";
import { configureMonaco } from "../../lib/customCodeNode/configureMonaco";
import { useConfirm } from "../../flow-editor/ports/ports";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@flyde/ui";
import { Button, HotkeyIndication, X } from "@flyde/ui";
import { Alert, AlertDescription } from "@flyde/ui";
import { useToast } from "@flyde/ui";
import { Copilot } from "./Copilot";
import type { editor } from 'monaco-editor';

interface CustomNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (code: string) => Promise<void>;
  forkMode?: { node: NodeOrMacroDefinition; initialCode: string };
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
  const monaco = useMonaco();

  const [code, setCode] = useState<string>(
    forkMode?.initialCode || defaultContent
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isAIFlowpilotOpen, setIsAIFlowpilotOpen] = useState(false);

  // Key state for managing diff editor
  const [diffVisible, setDiffVisible] = useState(false);
  const [diffMounted, setDiffMounted] = useState(false); // Track if diff editor has ever been mounted
  const [originalCode, setOriginalCode] = useState("");
  const [proposedCode, setProposedCode] = useState("");

  // Refs for editor instances
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);

  // Handle regular editor mount
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    if (monaco?.KeyMod && monaco?.KeyCode) {
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          handleSave();
        }
      );
    }

    editor.focus();
  };

  // Handle diff editor mount
  const handleDiffEditorDidMount = (editor: editor.IStandaloneDiffEditor) => {
    diffEditorRef.current = editor;
  };

  const editorOptions = useMemo(() => {
    return {
      minimap: { enabled: false },
    };
  }, []);

  // Handle editor content changes
  const handleEditorChange = useCallback((value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);
    setHasChanges(true);
  }, []);

  // Handle modal close
  const handleClose = useCallback(async () => {
    if (
      !hasChanges ||
      (await confirm(
        "You have unsaved changes. Are you sure you want to close?"
      ))
    ) {
      // Just hide the diff view
      setDiffVisible(false);
      onClose();
    }
  }, [hasChanges, onClose, confirm]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(code);
      onClose();
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

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  // Configure Monaco
  useEffect(() => {
    if (monaco) {
      configureMonaco(monaco);
    }
  }, [monaco]);

  /**
   * Handle AI panel toggle
   * 
   * IMPORTANT: We don't unmount the diff editor after it's first mounted to avoid
   * "TextModel got disposed before DiffEditorWidget model got reset" errors.
   * Instead, we just toggle its visibility.
   */
  const handleToggleAI = useCallback(() => {
    if (isAIFlowpilotOpen) {
      // Hide the diff view but don't unmount it
      setDiffVisible(false);
      setIsAIFlowpilotOpen(false);
    } else {
      setIsAIFlowpilotOpen(true);
    }
  }, [isAIFlowpilotOpen]);

  /**
   * Handle code proposal from Copilot
   * 
   * IMPORTANT: We lazy-mount the diff editor only when it's first needed,
   * then keep it mounted forever (just toggling visibility) to avoid Monaco
   * disposal issues.
   */
  const handlePropose = useCallback((proposedCode: string | undefined) => {
    if (proposedCode) {
      // Set the diff content
      setOriginalCode(code);
      setProposedCode(proposedCode);

      // Mount the diff editor if this is the first proposal
      if (!diffMounted) {
        setDiffMounted(true);
      }

      // Show the diff view
      setDiffVisible(true);
    } else {
      // Hide the diff view but don't unmount it
      setDiffVisible(false);
    }
  }, [code, diffMounted]);

  /**
   * Handle accepting code changes
   * 
   * Updates the code and hides (but doesn't unmount) the diff editor
   * to avoid Monaco disposal issues.
   */
  const handleAccept = useCallback(() => {
    // Update the main editor's code
    setCode(proposedCode);
    setHasChanges(true);

    // Hide the diff editor but don't unmount it
    setDiffVisible(false);

    toast({
      title: "Changes Applied",
      description: "AI-suggested changes have been applied to the node.",
    });
  }, [toast, proposedCode]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[90vw] h-[80vh] flex p-0 overflow-hidden"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        noCloseButton={true}
      >
        <div className={`flex-1 flex flex-col p-4 min-w-0 overflow-hidden ${isAIFlowpilotOpen ? 'w-[calc(100%-350px)]' : 'w-full'}`}>
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>{forkMode ? "Fork Custom Node" : "Create Custom Node"}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleAI}
              >
                {isAIFlowpilotOpen ? "Hide AI" : "Show AI"}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
            {forkMode && (
              <Alert>
                <AlertDescription>
                  You are forking a new custom code node from{" "}
                  {forkMode.node.displayName || forkMode.node.id}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex-1 overflow-hidden relative">
              {/* Main editor - always mounted, hidden when diff is shown */}
              <div
                className={`absolute inset-0 w-full h-full ${diffVisible ? 'hidden' : 'block'}`}
              >
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  value={code}
                  onChange={handleEditorChange}
                  theme="vs-dark"
                  options={editorOptions}
                  loading={<div>Loading editor...</div>}
                  onMount={handleEditorDidMount}
                />
              </div>

              {/* 
                Diff editor - lazy mounted only when first needed, then kept forever
                This pattern avoids the "TextModel got disposed" error by:
                1. Not using memory until diff is first needed
                2. Never unmounting the component once it's been created
              */}
              {diffMounted && (
                <div
                  className={`absolute inset-0 w-full h-full ${diffVisible ? 'block' : 'hidden'}`}
                >
                  <DiffEditor
                    height="100%"
                    language="typescript"
                    original={originalCode}
                    modified={proposedCode}
                    theme="vs-dark"
                    options={{
                      ...editorOptions,
                      readOnly: true,
                      renderSideBySide: true,
                    }}
                    onMount={handleDiffEditorDidMount}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
              {isSaving ? "Saving..." : "Save"}
              <HotkeyIndication hotkey="cmd+enter" />
            </Button>
          </DialogFooter>
        </div>

        {isAIFlowpilotOpen ? (
          <>
            <div className="border-l border-neutral-800 flex-shrink-0 w-[350px] relative">
              <Copilot
                isOpen={isAIFlowpilotOpen}
                onClose={handleToggleAI}
                onPropose={handlePropose}
                onAccept={handleAccept}
              />
            </div>
            <DialogClose className="absolute right-[354px] top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </>
        ) : (
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        )}
      </DialogContent>
    </Dialog>
  );
}
