import {
  FormGroup,
  HTMLSelect,
  InputGroup,
  NumericInput,
  TextArea,
} from "@blueprintjs/core";
import type { InlineValueConfig } from "./InlineValue.flyde";
import React, { useCallback, useMemo } from "react";
import { getVariables } from "./getInlineVariables";

const types: InlineValueConfig["type"][] = [
  "string",
  "number",
  "json",
  "boolean",
  "expression",
];

const defaultValuePerType = {
  string: (currValue: any) => `${currValue}`,
  number: (currValue: any) =>
    isNaN(Number(currValue)) ? 0 : Number(currValue),
  json: (currValue: any) => JSON.stringify(currValue),
  boolean: (currValue: any) => !!currValue,
  expression: (currValue: any) => currValue,
};

function InlineValueEditor(props: {
  value: InlineValueConfig;
  onChange: (value: InlineValueConfig) => void;
}) {
  const { value, onChange } = props;

  const changeType = useCallback(
    (type) => {
      onChange({ value: defaultValuePerType[type](value.value), type });
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
      case "expression": {
        const vars = getVariables(value.value);
        return (
          <>
            <FormGroup
              label="Value:"
              helperText={`Accepts any valid JS extension. `}
            >
              <TextArea
                value={value.value}
                fill
                onChange={(e) => changeValue(e.target.value)}
              />
            </FormGroup>
            <div>
              {vars.length > 0 ? (
                <small>
                  External inputs exposed from this expression:{" "}
                  <em>{vars.join(", ")}</em>
                </small>
              ) : (
                <small>
                  Expose external inputs by using the "inputs" object. For
                  example, "inputs.a + inputs.b" will expose 2 inputs, a and b,
                  and sum them.
                </small>
              )}
            </div>
          </>
        );
      }
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
}

export default InlineValueEditor;
