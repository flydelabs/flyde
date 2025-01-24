import { FormGroup, Textarea } from "@flyde/ui";
import type { CodeExpressionConfig } from "./CodeExpression.flyde";
import React, { useCallback } from "react";
import { getVariables } from "./getInlineVariables";
import { MacroEditorComp } from "@flyde/core";

const CodeExpressionEditor: MacroEditorComp<CodeExpressionConfig> =
  function CodeExpressionEditor(props) {
    const { value, onChange } = props;

    const changeValue = useCallback(
      (_val) => {
        onChange({ ...value, value: _val });
      },
      [value, onChange]
    );

    const vars = getVariables(value.value ?? "");

    return (
      <div>
        <FormGroup label="Accepts any valid JS code that returns an expression">
          <Textarea
            value={value.value}
            style={{ width: "100%" }}
            onChange={(e) => changeValue(e.target.value)}
          />
        </FormGroup>
        <div style={{ marginTop: "8px" }}>
          {vars.length > 0 ? (
            <span style={{ fontSize: "0.875rem", color: "#666" }}>
              External inputs exposed from this expression:{" "}
              <em>{vars.join(", ")}</em>
            </span>
          ) : (
            <span style={{ fontSize: "0.875rem", color: "#666" }}>
              Expose external inputs by using the "inputs" object. For example,
              "inputs.a + inputs.b" will expose 2 inputs, a and b, and sum them.
            </span>
          )}
        </div>
      </div>
    );
  };

export default CodeExpressionEditor;
