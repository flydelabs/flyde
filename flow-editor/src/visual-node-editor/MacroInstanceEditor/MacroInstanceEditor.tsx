import { Button } from "@flyde/ui";
import { Dialog, DialogContent, DialogFooter } from "@flyde/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flyde/ui";
import { Alert, AlertDescription, AlertTitle, Info, GitFork } from "@flyde/ui";

import {
  MacroNodeDefinition,
  ResolvedDependenciesDefinitions,
  ResolvedMacroNodeInstance,
  isMacroNodeDefinition,
} from "@flyde/core";

import { ErrorBoundary } from "react-error-boundary";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { loadMacroEditor } from "./macroEditorLoader";
import { usePrompt } from "../../flow-editor/ports";
import { useDependenciesContext } from "../../flow-editor/DependenciesContext";
import { Loader } from "../../lib/loader";

export interface MacroInstanceEditorProps {
  deps: ResolvedDependenciesDefinitions;
  ins: ResolvedMacroNodeInstance;
  onCancel: () => void;
  onSubmit: (value: any) => void;
  onSwitchToSiblingMacro: (newMacro: MacroNodeDefinition<any>) => void;
}

export const MacroInstanceEditor: React.FC<MacroInstanceEditorProps> = (
  props
) => {
  const { deps, ins, onCancel } = props;

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
    const macro = deps[ins.macroId];
    if (macro && !isMacroNodeDefinition(macro)) {
      throw new Error(`Macro ${ins.macroId} not found `);
    }
    return macro as any as MacroNodeDefinition<any>;
  }, [deps, ins.macroId]);

  useEffect(() => {
    if (macro) {
      onRequestSiblingNodes(macro).then(setMacroSiblings);
    }
  }, [macro, onRequestSiblingNodes]);

  const [macroData, setMacroData] = React.useState<any>(ins.macroData);

  const EditorComp = useMemo(() => {
    const macro = deps[ins.macroId];
    if (!macro) {
      throw new Error(`Macro ${ins.macroId} not found `);
    }
    return loadMacroEditor(macro as any as MacroNodeDefinition<any>);
  }, [deps, ins]);

  const prompt = usePrompt();

  if (!macro) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh]">
          <Loader />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={props.onCancel}>
      <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[90vh]">
        <div className="flex-none">
          {onForkNode && (
            <div className="flex justify-end mb-4">
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
                const selectedMacro = macroSiblings.find((m) => m.id === value);
                if (selectedMacro) {
                  props.onSwitchToSiblingMacro(selectedMacro);
                }
              }}
            >
              <SelectTrigger className="w-full mb-4">
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
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>{macro.displayName ?? macro.id}</AlertTitle>
              <AlertDescription>{macro.description}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 mb-4">
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
              onChange={setMacroData}
              prompt={prompt}
            />
          </ErrorBoundary>
        </div>

        <div className="flex-none">
          <DialogFooter>
            <Button variant="outline" onClick={props.onCancel}>
              Cancel
            </Button>
            <Button onClick={() => props.onSubmit(macroData)}>Save</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
