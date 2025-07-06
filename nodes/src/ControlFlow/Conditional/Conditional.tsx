import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@flyde/editor";
import { ConditionalConfig } from "./Conditional.flyde";
import React from "react";
import { ConfigurableEditorComp, ConfigurableFieldDefinition } from "@flyde/core";

import { ConfigurableFieldEditor } from "@flyde/editor";

// copied from Conditional.flyde.ts
enum ConditionType {
  Equal = "EQUAL",
  NotEqual = "NOT_EQUAL",
  Contains = "CONTAINS",
  NotContains = "NOT_CONTAINS",
  RegexMatches = "REGEX_MATCHES",
  Exists = "EXISTS",
  NotExists = "NOT_EXISTS",
}

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

const leftConfig: ConfigurableFieldDefinition = {
  type: "string",
  configKey: "leftOperand",
  label: "Left Operand",
};

const rightConfig: ConfigurableFieldDefinition = {
  type: "string",
  configKey: "rightOperand",
  label: "Right Operand",
};

const ConditionalEditor: ConfigurableEditorComp<ConditionalConfig> =
  function ConditionalEditor(props) {
    const { value, onChange, ports, nodeId, insId } = props;

    const showRightOperand = ![
      ConditionType.Exists,
      ConditionType.NotExists,
    ].includes(value.condition.type);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            Condition Type
          </label>
          <Select
            value={value.condition.type}
            onValueChange={(val) =>
              onChange({
                ...value,
                condition: {
                  type: val as ConditionType,
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(conditionEnumToLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(value.condition.type === ConditionType.Contains ||
          value.condition.type === ConditionType.NotContains) && (
            <div
              style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}
            >
              For "Contains" and "Not Contains", the input value can be a string
              or an array. If it's a string, it checks if the string contains the
              compared value. If it's an array, it checks if the array includes
              the compared value.
            </div>
          )}

        <Separator />

        <ConfigurableFieldEditor
          ports={ports}
          value={value.leftOperand}
          onChange={(val) => {
            onChange({
              ...value,
              leftOperand: val,
            });
          }}
          config={leftConfig}
          nodeId={nodeId}
          insId={insId}
        />

        {showRightOperand && (
          <ConfigurableFieldEditor
            ports={ports}
            value={value.rightOperand}
            onChange={(val) => {
              onChange({
                ...value,
                rightOperand: val,
              });
            }}
            config={rightConfig}
            nodeId={nodeId}
            insId={insId}
          />
        )}
      </div>
    );
  };

export default ConditionalEditor;
