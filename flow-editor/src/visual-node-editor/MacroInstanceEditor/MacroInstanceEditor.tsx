import {
  Button,
  Callout,
  Classes,
  Dialog,
  Intent,
  MenuItem,
} from "@blueprintjs/core";
import {
  MacroNodeDefinition,
  ResolvedDependenciesDefinitions,
  ResolvedMacroNodeInstance,
  isMacroNodeDefinition,
} from "@flyde/core";
import classNames from "classnames";

import { ErrorBoundary } from "react-error-boundary";

import React, { useEffect, useMemo, useState } from "react";
import { loadMacroEditor } from "./macroEditorLoader";
import { DoubleCaretVertical, InfoSign } from "@blueprintjs/icons";
import { usePrompt } from "../../flow-editor/ports";
import { Select } from "@blueprintjs/select";
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
  const { deps, ins } = props;

  const { onRequestSiblingNodes } = useDependenciesContext();

  const [macroSiblings, setMacroSiblings] = useState<
    MacroNodeDefinition<any>[]
  >([]);

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
    if (!macro || !isMacroNodeDefinition(macro)) {
      throw new Error(`Macro ${ins.macroId} not found `);
    }
    return loadMacroEditor(macro as any as MacroNodeDefinition<any>);
  }, [deps, ins]);

  const prompt = usePrompt();

  if (!macro) {
    return (
      <Dialog isOpen={true} className="macro-instance-editor no-drag">
        <main className={classNames(Classes.DIALOG_BODY)} tabIndex={0}>
          <Loader />
        </main>
      </Dialog>
    );
  }

  return (
    <Dialog isOpen={true} className="macro-instance-editor no-drag">
      <main className={classNames(Classes.DIALOG_BODY)} tabIndex={0}>
        {macroSiblings.length > 1 ? (
          <Select
            items={macroSiblings}
            fill
            itemRenderer={(item, { handleClick }) => (
              <MenuItem
                key={item.id}
                text={item.displayName || item.id}
                onClick={handleClick}
              />
            )}
            onItemSelect={(selectedMacro) => {
              props.onSwitchToSiblingMacro(
                selectedMacro as any as MacroNodeDefinition<any>
              );
            }}
            filterable={false}
            popoverProps={{ minimal: true }}
          >
            <Button
              text={macro.displayName ?? macro.id}
              fill
              rightIcon={<DoubleCaretVertical />}
              alignText="left"
              style={{ marginBottom: "5px" }}
            />
          </Select>
        ) : null}
        {macro.description ? (
          <Callout
            intent="primary"
            className="macro-description"
            icon={<InfoSign />}
            title={macro.displayName ?? macro.id}
          >
            {macro.description}
          </Callout>
        ) : null}
        <ErrorBoundary
          fallback={
            <span>
              Error loading macro editor{" "}
              <Button onClick={() => setMacroData(macro.defaultData)}>
                Reset to default
              </Button>
            </span>
          }
        >
          <EditorComp
            value={macroData}
            onChange={setMacroData}
            prompt={prompt}
          />
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
