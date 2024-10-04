import { Divider, FormGroup, HTMLSelect } from "@blueprintjs/core";
import { ConditionType, ConditionalConfig } from "./Conditional.flyde";
import React from "react";
import { MacroEditorComp, MacroEditorFieldDefinition } from "@flyde/core";

import { MacroConfigurableFieldEditor } from "../lib/MacroConfigurableFieldEditor/MacroConfigurableFieldEditor";

const conditionEnumToLabel: Record<
  ConditionalConfig["condition"]["type"],
  string
> = {
  [ConditionType.Equal]: "Equal",
  [ConditionType.NotEqual]: "Not Equal",
  [ConditionType.RegexMatches]: "Regex Matches",
  [ConditionType.Contains]: "Contains (string or array)",
  [ConditionType.NotContains]: "Not Contains (string or array)",
  [ConditionType.Exists]: "Exists (not null, undefined, or empty)",
  [ConditionType.NotExists]: "Does Not Exist (null, undefined, or empty)",
};

const leftConfig: MacroEditorFieldDefinition = {
  type: "string",
  configKey: "leftOperand",
  label: "Left Operand",
};

const rightConfig: MacroEditorFieldDefinition = {
  type: "string",
  configKey: "rightOperand",
  label: "Right Operand",
};

const ConditionalEditor: MacroEditorComp<ConditionalConfig> =
  function ConditionalEditor(props) {
    const { value, onChange, prompt } = props;

    const showRightOperand = ![
      ConditionType.Exists,
      ConditionType.NotExists,
    ].includes(value.condition.type);

    return (
      <>
        <FormGroup label="Condition Type">
          <HTMLSelect
            fill
            value={value.condition.type}
            onChange={(e) =>
              onChange({
                ...value,
                condition: {
                  type: e.target.value as ConditionType,
                },
              })
            }
          >
            {Object.entries(conditionEnumToLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </HTMLSelect>
        </FormGroup>
        {(value.condition.type === ConditionType.Contains ||
          value.condition.type === ConditionType.NotContains) && (
          <FormGroup
            helperText={`For "Contains" and "Not Contains", the input value can be a string or an array. If it's a string, it checks if the string contains the compared value. If it's an array, it checks if the array includes the compared value.`}
          />
        )}
        <Divider />

        <MacroConfigurableFieldEditor
          prompt={prompt}
          value={value.leftOperand}
          onChange={(val) => {
            onChange({
              ...value,
              leftOperand: val,
            });
          }}
          config={leftConfig}
        />

        {showRightOperand && (
          <MacroConfigurableFieldEditor
            prompt={prompt}
            value={value.rightOperand}
            onChange={(val) => {
              onChange({
                ...value,
                rightOperand: val,
              });
            }}
            config={rightConfig}
          />
        )}
      </>
    );
  };

export default ConditionalEditor;
