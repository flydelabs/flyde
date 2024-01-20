import { Button, Classes, Dialog, Intent } from "@blueprintjs/core";
import {
  MacroNodeDefinition,
  ResolvedDependenciesDefinitions,
  ResolvedMacroNodeInstance,
  isMacroNodeDefinition,
} from "@flyde/core";
import classNames from "classnames";

import { ErrorBoundary } from "react-error-boundary";

import React, { useMemo } from "react";
import { loadMacroEditor } from "./macroEditorLoader";

export interface MacroInstanceEditorProps {
  deps: ResolvedDependenciesDefinitions;
  ins: ResolvedMacroNodeInstance;
  onCancel: () => void;
  onSubmit: (value: any) => void;
}

export const MacroInstanceEditor: React.FC<MacroInstanceEditorProps> = (
  props
) => {
  const { deps, ins } = props;

  const [macroData, setMacroData] = React.useState<any>(ins.macroData);

  const macro = useMemo(() => {
    const macro = deps[ins.macroId];
    if (!macro || !isMacroNodeDefinition(macro)) {
      throw new Error(`Macro ${ins.macroId} not found `);
    }
    return macro;
  }, [deps, ins.macroId]);

  const EditorComp = useMemo(() => {
    const macro = deps[ins.macroId];
    if (!macro || !isMacroNodeDefinition(macro)) {
      throw new Error(`Macro ${ins.macroId} not found `);
    }
    return loadMacroEditor(macro as any as MacroNodeDefinition<any>);
  }, [deps, ins]);

  return (
    <Dialog
      isOpen={true}
      title={`Edit ${macro.displayName ?? macro.id} Configuration`}
      onClose={props.onCancel}
      className="macro-instance-editor no-drag"
    >
      <main className={classNames(Classes.DIALOG_BODY)} tabIndex={0}>
        <ErrorBoundary fallback={<span>bob</span>}>
          <EditorComp value={macroData} onChange={setMacroData} />
        </ErrorBoundary>
      </main>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={props.onCancel}>Cancel</Button>
          <Button
            onClick={() => props.onSubmit(macroData)}
            intent={Intent.PRIMARY}
            className="save-btn"
          >
            Save
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
