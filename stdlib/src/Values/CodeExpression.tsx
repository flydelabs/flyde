import { FormGroup, InputGroup, TextArea } from "@blueprintjs/core";
import type { InlineValueConfig } from "./InlineValue.flyde";
import React, { useCallback, useState } from "react";
import { getVariables } from "./getInlineVariables";
import { MacroEditorComp } from "@flyde/core";

const labelMaxLength = 50;

function valToLabel(val: any): string {
  try {
    if (val.length > labelMaxLength) {
      return `${val.slice(0, labelMaxLength)}...`;
    }
    return val;
  } catch (e) {
    return `Value`;
  }
}

const CodeExpressionEditor: MacroEditorComp<InlineValueConfig> =
  function CodeExpressionEditor(props) {
    const { value, onChange } = props;
    const [isLabelCustom, setIsLabelCustom] = useState(false);

    const changeValue = useCallback(
      (_val) => {
        const labelToUse = isLabelCustom ? value.label : valToLabel(_val);
        onChange({ ...value, value: _val, label: labelToUse });
      },
      [value, onChange]
    );

    const changeLabel = useCallback(
      (newLabel) => {
        setIsLabelCustom(newLabel ? true : false);
        onChange({ ...value, label: newLabel });
      },
      [value, onChange]
    );

    const vars = getVariables(value.value ?? "");

    return (
      <div>
        <FormGroup label="Value:" helperText={`Accepts any valid JS code`}>
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
            onChange={(e) => changeLabel(e.target.value)}
            placeholder="Code Expression"
          />
        </FormGroup>
      </div>
    );
  };

export default CodeExpressionEditor;
