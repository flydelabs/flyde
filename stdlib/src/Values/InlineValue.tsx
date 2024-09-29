import {
  FormGroup,
  HTMLSelect,
  InputGroup,
  NumericInput,
} from "@blueprintjs/core";
import type { InlineValueConfig } from "./InlineValue.flyde";
import React, { useCallback, useMemo } from "react";
import { MacroEditorComp } from "@flyde/core";
import { SimpleJsonEditor } from "../lib/SimpleJsonEditor";

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
};

const InlineValueEditor: MacroEditorComp<InlineValueConfig> =
  function InlineValueEditor(props) {
    const { value, onChange } = props;

    const changeType = useCallback(
      (type) => {
        const newValue = defaultValuePerType[type](value.value);
        onChange({ value: newValue, type });
      },
      [value, onChange]
    );

    const changeValue = useCallback(
      (_val) => {
        onChange({ ...value, value: _val });
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
              <SimpleJsonEditor value={value.value} onChange={changeValue} />
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
      </div>
    );
  };

export default InlineValueEditor;
