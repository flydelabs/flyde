import { FormGroup, InputGroup, TextArea } from "@blueprintjs/core";
import type { InlineValueConfig } from "./InlineValue.flyde";
import React, { useCallback } from "react";
import { getVariables } from "./getInlineVariables";
import { MacroEditorComp } from "@flyde/core";

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

const CodeExpressionEditor: MacroEditorComp<InlineValueConfig> =
  function CodeExpressionEditor(props) {
    const { value, onChange } = props;

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

    const vars = getVariables(value.value ?? "");

    return (
      <div>
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
              Expose external inputs by using the "inputs" object. For example,
              "inputs.a + inputs.b" will expose 2 inputs, a and b, and sum them.
            </small>
          )}
        </div>
        <FormGroup label="Label:">
          <InputGroup
            type="text"
            value={value.label}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
            placeholder="Code Expression"
          />
        </FormGroup>
      </div>
    );
  };

export default CodeExpressionEditor;
