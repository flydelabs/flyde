import React from "react";
import {
  BasePart,
  entries,
  InputMode,
  okeys,
  partInput,
  partOutput,
} from "@flyde/core";
// ;
import { Checkbox, Collapse, FormGroup, InputGroup, MenuItem } from "@blueprintjs/core";
import Editor from "@monaco-editor/react";
import produce from "immer";
import { MultiSelect } from "@blueprintjs/select";
import { PartPreview } from "../../PartPreview/PartPreview";

export const renderCreateIOOption = (
  query: string,
  active: boolean,
  handleClick: React.MouseEventHandler<HTMLElement>
) => (
  <MenuItem
    icon="add"
    text={`Create "${query}"`}
    active={active}
    onClick={handleClick}
    shouldDismissPopover={false}
  />
);

const IOMultiSelect = MultiSelect.ofType<string>();

export interface BasePartEditorProps {
  part: BasePart;
  onChange: (part: BasePart) => void;
  idDisabled: boolean;
  hiddenOutputs?: boolean;
}

export const BasePartEditor: React.FC<BasePartEditorProps> = (props) => {
  const { part, onChange } = props;

  const allInputs = entries(part.inputs);
  const requiredInputs = allInputs
    .filter(([, i]) => i.mode === "required")
    .map(([k]) => k);
  const optionalInputs = allInputs
    .filter(([, i]) => i.mode === "optional")
    .map(([k]) => k);
  const ricInputs = allInputs
    .filter(([, i]) => i.mode === "required-if-connected")
    .map(([k]) => k);

  const [showAdvancedOptions, setShowAdvancedOptions] = React.useState(false);

  const outputs = okeys(part.outputs);

  const onChangeId = React.useCallback(
    (id) => {
      onChange({ ...part, id });
    },
    [part, onChange]
  );

  const onChangeCompletionOutputs = React.useCallback(
    (completionOutputsStr) => {
      let array = completionOutputsStr
        ? completionOutputsStr.split(",")
        : undefined;
      if (completionOutputsStr === "[]") {
        array = [];
      }
      console.log(completionOutputsStr, array);
      onChange({ ...part, completionOutputs: array });
    },
    [part, onChange]
  );

  const onChangeReactiveInputs = React.useCallback(
    (reactiveInputsStr) => {
      let array = reactiveInputsStr ? reactiveInputsStr.split(",") : undefined;
      onChange({ ...part, reactiveInputs: array });
    },
    [part, onChange]
  );

  const onAddInput = React.useCallback(
    (name: string, mode: InputMode) => {
      const newPart = produce(part, (draft) => {
        draft.inputs[name] = partInput( mode);
      });
      onChange(newPart);
    },
    [part, onChange]
  );

  const onRemoveInput = React.useCallback(
    (name: string) => {
      const newPart = produce(part, (draft) => {
        delete draft.inputs[name];
      });
      onChange(newPart);
    },
    [part, onChange]
  );

  const onAddOutput = React.useCallback(
    (name: string) => {
      const newPart = produce(part, (draft) => {
        draft.outputs[name] = partOutput();
      });
      onChange(newPart);
    },
    [part, onChange]
  );

  const onRemoveOutput = React.useCallback(
    (name: string) => {
      const newPart = produce(part, (draft) => {
        delete draft.outputs[name];
      });
      onChange(newPart);
    },
    [part, onChange]
  );

  const onChangeTypes = React.useCallback(
    (code: string) => {
      try {
        const p: any = JSON.parse(code);
        const newPart = produce(part, (draft) => {
          Object.entries(p).forEach(([k, v]: [string, any]) => {
            const input = draft.inputs[k];
            const output = draft.outputs[k];
            if (input) {
              draft.inputs[k] = { ...input };
            } else if (output) {
              draft.outputs[k] = { ...output };
            }
          });
        });
        onChange(newPart);
      } catch (e) {
        console.error("cannot parse");
      }
    },
    [onChange, part]
  );


  return (
    <div className="base-part-editor">
      <div className="form-row">
        <FormGroup
          label="Part Name"
          labelFor="text-input"
          labelInfo="(required)"
        >
          <InputGroup
            id="part-name"
            disabled={props.idDisabled}
            placeholder="Part ID"
            value={part.id}
            onChange={(e: any) => onChangeId(e.target.value)}
          />
        </FormGroup>
      </div>
      <FormGroup label="Required Inputs">
        <IOMultiSelect
          selectedItems={requiredInputs}
          placeholder={"Enter input names here"}
          items={[]}
          tagRenderer={(str) => str}
          onItemSelect={(item) => onAddInput(item, "required")}
          onRemove={onRemoveInput}
          resetOnSelect={true}
          itemRenderer={(item) => <span>{item}</span>}
          createNewItemFromQuery={(t) => t}
          createNewItemRenderer={renderCreateIOOption}
          fill={true}
        />
      </FormGroup>

      {props.hiddenOutputs !== true ? (
        <FormGroup label="Outputs">
          <IOMultiSelect
            selectedItems={outputs}
            placeholder={"Enter output names here"}
            items={[]}
            tagRenderer={(str) => str}
            onItemSelect={onAddOutput}
            onRemove={onRemoveOutput}
            resetOnSelect={true}
            itemRenderer={(item) => <span>{item}</span>}
            createNewItemFromQuery={(t) => t}
            createNewItemRenderer={renderCreateIOOption}
            fill={true}
          />
        </FormGroup>
      ) : null}

      <Checkbox
        checked={showAdvancedOptions}
        onChange={(e) =>
          setShowAdvancedOptions((e.target as HTMLInputElement).checked)
        }
      >
        Show advanced options
      </Checkbox>

      <Collapse isOpen={showAdvancedOptions}>
        <FormGroup label="Optional Inputs">
          <IOMultiSelect
            selectedItems={optionalInputs}
            placeholder={"Enter input names here"}
            items={[]}
            tagRenderer={(str) => str}
            onItemSelect={(item) => onAddInput(item, "optional")}
            onRemove={onRemoveInput}
            resetOnSelect={true}
            itemRenderer={(item) => <span>{item}</span>}
            createNewItemFromQuery={(t) => t}
            createNewItemRenderer={renderCreateIOOption}
            fill={true}
          />
        </FormGroup>

        <FormGroup label="Required-if-connected Inputs">
          <IOMultiSelect
            selectedItems={ricInputs}
            placeholder={"Enter input names here"}
            items={[]}
            tagRenderer={(str) => str}
            onItemSelect={(item) => onAddInput(item, "required-if-connected")}
            onRemove={onRemoveInput}
            resetOnSelect={true}
            itemRenderer={(item) => <span>{item}</span>}
            createNewItemFromQuery={(t) => t}
            createNewItemRenderer={renderCreateIOOption}
            fill={true}
          />
        </FormGroup>

        <FormGroup label="Completion Outputs">
          <InputGroup
            id="completion-outputs"
            placeholder="completion outputs"
            value={part.completionOutputs?.join(",") || ""}
            onChange={(e: any) => onChangeCompletionOutputs(e.target.value)}
          />
        </FormGroup>

        <FormGroup label="Reactive Inputs">
          <InputGroup
            id="reactive-inputs"
            placeholder="Reactive inputs"
            value={part.reactiveInputs?.join(",") || ""}
            onChange={(e: any) => onChangeReactiveInputs(e.target.value)}
          />
        </FormGroup>
      </Collapse>

      <FormGroup label="Preview">
        <div className="preview-wrapper">
          <PartPreview part={part} />
        </div>
      </FormGroup>
    </div>
  );
};
