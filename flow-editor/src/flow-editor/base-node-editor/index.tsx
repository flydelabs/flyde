import React from "react";
import {
  BaseNode,
  entries,
  InputMode,
  okeys,
  nodeInput,
  nodeOutput,
} from "@flyde/core";
// ;
import {
  Checkbox,
  Collapse,
  FormGroup,
  InputGroup,
  MenuItem,
} from "@blueprintjs/core";
import produce from "immer";
import { MultiSelect } from "@blueprintjs/select";
import { NodePreview } from "../../NodePreview/NodePreview";

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

export interface BaseNodeEditorProps {
  node: BaseNode;
  onChange: (node: BaseNode) => void;
  idDisabled: boolean;
  hiddenOutputs?: boolean;
}

export const BaseNodeEditor: React.FC<BaseNodeEditorProps> = (props) => {
  const { node, onChange } = props;

  const allInputs = entries(node.inputs);
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

  const outputs = okeys(node.outputs);

  const onChangeId = React.useCallback(
    (id) => {
      onChange({ ...node, id });
    },
    [node, onChange]
  );

  const onChangeCompletionOutputs = React.useCallback(
    (completionOutputsStr) => {
      let array = completionOutputsStr
        ? completionOutputsStr.split(",")
        : undefined;
      if (completionOutputsStr === "[]") {
        array = [];
      }
      onChange({ ...node, completionOutputs: array });
    },
    [node, onChange]
  );

  const onChangeReactiveInputs = React.useCallback(
    (reactiveInputsStr) => {
      let array = reactiveInputsStr ? reactiveInputsStr.split(",") : undefined;
      onChange({ ...node, reactiveInputs: array });
    },
    [node, onChange]
  );

  const onAddInput = React.useCallback(
    (name: string, mode: InputMode) => {
      const newNode = produce(node, (draft) => {
        draft.inputs[name] = nodeInput(mode);
      });
      onChange(newNode);
    },
    [node, onChange]
  );

  const onRemoveInput = React.useCallback(
    (name: string) => {
      const newNode = produce(node, (draft) => {
        delete draft.inputs[name];
      });
      onChange(newNode);
    },
    [node, onChange]
  );

  const onAddOutput = React.useCallback(
    (name: string) => {
      const newNode = produce(node, (draft) => {
        draft.outputs[name] = nodeOutput();
      });
      onChange(newNode);
    },
    [node, onChange]
  );

  const onRemoveOutput = React.useCallback(
    (name: string) => {
      const newNode = produce(node, (draft) => {
        delete draft.outputs[name];
      });
      onChange(newNode);
    },
    [node, onChange]
  );

  return (
    <div className="base-node-editor">
      <div className="form-row">
        <FormGroup
          label="Node Name"
          labelFor="text-input"
          labelInfo="(required)"
        >
          <InputGroup
            id="node-name"
            disabled={props.idDisabled}
            placeholder="Node ID"
            value={node.id}
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
            value={node.completionOutputs?.join(",") || ""}
            onChange={(e: any) => onChangeCompletionOutputs(e.target.value)}
          />
        </FormGroup>

        <FormGroup label="Reactive Inputs">
          <InputGroup
            id="reactive-inputs"
            placeholder="Reactive inputs"
            value={node.reactiveInputs?.join(",") || ""}
            onChange={(e: any) => onChangeReactiveInputs(e.target.value)}
          />
        </FormGroup>
      </Collapse>

      <FormGroup label="Preview">
        <div className="preview-wrapper">
          <NodePreview node={node} />
        </div>
      </FormGroup>
    </div>
  );
};
