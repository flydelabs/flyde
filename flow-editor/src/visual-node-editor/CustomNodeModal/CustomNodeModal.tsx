import { useState, useCallback, useMemo, useEffect } from "react";
import { Dialog, Classes, Button, Callout, Intent } from "@blueprintjs/core";
import { Editor, useMonaco } from "@monaco-editor/react";
import { NodeOrMacroDefinition } from "@flyde/core";
// import { configureMonaco } from "@/lib/customCodeNode/configureMonaco";

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

export default {
  id: "Add",
  displayName: "Add",
  defaultStyle: {
    icon: "fa-plus",
  },
  description: "Emits the sum of two numbers",
  inputs: {
    n1: { description: "First number to add" },
    n2: { description: "Second number to add" },
  },
  outputs: { sum: { description: "The sum of n1 and n2" } },
  run: ({ n1, n2 }, { sum }) => sum.next(n1 + n2),
};


`;

export function CustomNodeModal({
  isOpen,
  onClose,
  onSave,
  forkMode,
}: CustomNodeModalProps) {
  const [code, setCode] = useState<string>(
    forkMode?.initialCode || defaultContent
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleEditorChange = useCallback((value: string | undefined) => {
    setCode(value || "");
  }, []);

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
    } finally {
      setIsSaving(false);
    }
  };

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      //   configureMonaco(monaco);
    }
  }, [monaco]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="custom-node-modal no-drag"
    >
      <div className={Classes.DIALOG_HEADER}>
        <h4 className={Classes.HEADING}>
          {forkMode ? "Fork Custom Node" : "Create Custom Node"}
        </h4>
      </div>
      <div className={Classes.DIALOG_BODY}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {forkMode && (
            <Callout intent={Intent.PRIMARY}>
              You are forking a new custom code node from{" "}
              {forkMode.node.displayName || forkMode.node.id}
            </Callout>
          )}
          <Editor
            height="400px"
            defaultLanguage="typescript"
            value={code}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={editorOptions}
            loading={<div>Loading editor...</div>}
          />
        </div>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            intent={Intent.PRIMARY}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
