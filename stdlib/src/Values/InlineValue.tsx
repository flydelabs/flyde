import {
  FormGroup,
  HTMLSelect,
  InputGroup,
  NumericInput,
  TextArea,
} from "@blueprintjs/core";
import type { InlineValueConfig } from "./InlineValue.flyde";
import React, { useCallback, useMemo } from "react";
import { MacroEditorComp } from "@flyde/core";

const types: InlineValueConfig["type"][] = [
  "string",
  "number",
  "json",
  "boolean",
];

const defaultValuePerType = {
  string: (currValue: any) => `${currValue}`,
  number: (currValue: any) =>
    isNaN(Number(currValue)) ? 0 : Number(currValue),
  json: (currValue: any) => JSON.stringify(currValue),
  boolean: (currValue: any) => !!currValue,
  expression: (currValue: any) => currValue,
};

const labelMaxLength = 20;

function valToLabel(val: any): string {
  try {
    const label = JSON.stringify(val);
    if (label.length > labelMaxLength) {
      return `${label.slice(0, labelMaxLength)}...`;
    }
    return label;
  } catch (e) {
    return `Value`;
  }
}

const InlineValueEditor: MacroEditorComp<InlineValueConfig> =
  function InlineValueEditor(props) {
    const { value, onChange } = props;

    const changeType = useCallback(
      (type) => {
        const newValue = defaultValuePerType[type](value.value);
        onChange({
          value: newValue,
          type,
          label:
            valToLabel(value.value) === value.label
              ? valToLabel(newValue)
              : value.label,
        });
      },
      [value, onChange]
    );

    const changeValue = useCallback(
      (_val) => {
        const newLabel = valToLabel(_val);
        const oldLabel = valToLabel(value.value);

        const wasUsingDefaultLabel = value.label === oldLabel || !value.label;

        const labelToUse = wasUsingDefaultLabel ? newLabel : value.label;

        onChange({ ...value, value: _val, label: labelToUse });
      },
      [value, onChange]
    );

    const editorPanel = useMemo(() => {
      switch (value.type) {
        case "string":
          return (
            <FormGroup label="Value:">
              <InputGroup
                type="text"
                value={value.value}
                onChange={(e) => changeValue(e.target.value)}
              />
            </FormGroup>
          );
        case "number":
          return (
            <FormGroup label="Value:">
              <NumericInput
                value={value.value}
                onValueChange={(e) => changeValue(e)}
              />
            </FormGroup>
          );
        case "json":
          return (
            <FormGroup label="Value:">
              <TextArea
                value={value.value}
                onChange={(e) => changeValue(e.target.value)}
              />
            </FormGroup>
          );
        case "boolean":
          return (
            <FormGroup label="Value:">
              <HTMLSelect
                value={value.value}
                onChange={(e) => changeValue(e.target.value === "true")}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </HTMLSelect>
            </FormGroup>
          );
      }
    }, [value, changeValue]);

    return (
      <div>
        <FormGroup label="Value type:">
          <HTMLSelect
            value={value.type}
            onChange={(e) =>
              changeType(e.target.value as InlineValueConfig["type"])
            }
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </HTMLSelect>
        </FormGroup>
        {editorPanel}
        <FormGroup label="Label:">
          <InputGroup
            type="text"
            value={value.label}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
          />
        </FormGroup>
      </div>
    );
  };

export default InlineValueEditor;
