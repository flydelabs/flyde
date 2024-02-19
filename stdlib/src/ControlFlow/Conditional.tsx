import {
  Checkbox,
  Divider,
  FormGroup,
  HTMLSelect,
  InputGroup,
  NumericInput,
} from "@blueprintjs/core";
import { ConditionType, ConditionalConfig } from "./ControlFlow.flyde";
import React, { useMemo } from "react";
import { SimpleJsonEditor } from "../lib/SimpleJsonEditor";
import { MacroEditorComp } from "@flyde/core";

const conditionEnumToLabel: Record<
  ConditionalConfig["condition"]["type"],
  string
> = {
  [ConditionType.Equal]: "Equal",
  [ConditionType.NotEqual]: "Not Equal",
  [ConditionType.GreaterThan]: "Greater Than",
  [ConditionType.GreaterThanOrEqual]: "Greater Than Or Equal",
  [ConditionType.LessThan]: "Less Than",
  [ConditionType.LessThanOrEqual]: "Less Than Or Equal",
  [ConditionType.Expression]: "JS Expression",
  [ConditionType.RegexMatches]: "Regex Matches",
  [ConditionType.Contains]: "Contains",
  [ConditionType.NotContains]: "Not Contains",
  [ConditionType.IsEmpty]: "Is Empty",
  [ConditionType.IsNotEmpty]: "Is Not Empty",
  [ConditionType.IsNull]: "Is Null",
  [ConditionType.IsNotNull]: "Is Not Null",
  [ConditionType.IsUndefined]: "Is Undefined",
  [ConditionType.IsNotUndefined]: "Is Not Undefined",
  [ConditionType.HasProperty]: "Has Property",
  [ConditionType.LengthEqual]: "Length Equal",
  [ConditionType.LengthNotEqual]: "Length Not Equal",
  [ConditionType.LengthGreaterThan]: "Length Greater Than",
  [ConditionType.LengthLessThan]: "Length Less Than",
  [ConditionType.TypeEquals]: "Type Equals",
};

const ConditionalEditor: MacroEditorComp<ConditionalConfig> =
  function ConditionalEditor(props) {
    const { value, onChange } = props;

    const [usePropPathValue, setUsePropPathValue] = React.useState(
      value.propertyPath !== ""
    );
    const [usePropPathCompareTo, setUsePropPathCompareTo] = React.useState(
      value.compareTo.mode === "dynamic" && value.compareTo.propertyPath !== ""
    );

    const maybeCompareToEditor = useMemo(() => {
      if (value.compareTo.mode !== "static") {
        return null;
      }

      switch (value.compareTo.type) {
        case "string": {
          return (
            <FormGroup label="Expected value">
              <InputGroup
                value={value.compareTo.value}
                onChange={(e) =>
                  onChange({
                    ...value,
                    compareTo: {
                      mode: "static",
                      type: "string",
                      value: e.target.value,
                    },
                  })
                }
              />
            </FormGroup>
          );
        }
        case "number": {
          return (
            <FormGroup label="Expected value">
              <NumericInput
                value={value.compareTo.value}
                onValueChange={(e) =>
                  onChange({
                    ...value,
                    compareTo: {
                      mode: "static",
                      type: "number",
                      value: e,
                    },
                  })
                }
              />
            </FormGroup>
          );
        }
        case "json": {
          return (
            <FormGroup
              label="Expected value"
              helperText={`Any JS expression is valid here. You may use "value" and "compareTo" variables in your expression.`}
            >
              <SimpleJsonEditor
                value={value.compareTo.value}
                onChange={(val) => {
                  onChange({
                    ...value,
                    compareTo: {
                      mode: "static",
                      type: "json",
                      value: val,
                    },
                  });
                }}
                label="Expected Value"
              />
            </FormGroup>
          );
        }
      }
    }, [value]);

    return (
      <>
        <FormGroup label="Condition Type" inline>
          <HTMLSelect
            fill
            value={value.condition.type}
            onChange={(e) =>
              onChange({
                ...value,
                condition: {
                  type: e.target.value as any,
                  data:
                    e.target.value === ConditionType.Expression
                      ? "value / compareTo === 42"
                      : undefined,
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
        {value.condition.type === ConditionType.Expression && (
          <FormGroup
            label="Condition expression"
            helperText={`Any JS expression is valid here. You may use "value" and "compareTo" variables in your expression.`}
          >
            <InputGroup
              value={value.condition.data}
              onChange={(e) =>
                onChange({
                  ...value,
                  condition: {
                    type: ConditionType.Expression,
                    data: e.target.value,
                  },
                })
              }
            />
          </FormGroup>
        )}
        <Divider />

        <FormGroup label="Value to compare mode:" inline>
          <HTMLSelect
            value={value.compareTo.mode}
            onChange={(e) =>
              onChange({
                ...value,
                compareTo: {
                  mode: e.target.value as any,
                  value: e.target.value === "static" ? "" : undefined,
                  type: e.target.value === "static" ? "string" : undefined,
                },
              })
            }
          >
            <option value="static">Static</option>
            <option value="dynamic">Dynamic (via input)</option>
          </HTMLSelect>
        </FormGroup>
        {value.compareTo.mode === "static" && (
          <FormGroup label="Value to compare type:" inline>
            <HTMLSelect
              value={value.compareTo.type}
              onChange={(e) =>
                onChange({
                  ...value,
                  compareTo: {
                    mode: "static",
                    value:
                      e.target.value === "string"
                        ? ""
                        : e.target.value === "number"
                        ? 0
                        : "value / 42 > compareTo",
                    type: e.target.value as any,
                  },
                })
              }
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="expression">JS Expression</option>
            </HTMLSelect>
          </FormGroup>
        )}
        {maybeCompareToEditor}
        <Divider />

        <FormGroup label="Value to emit if true" inline>
          <HTMLSelect
            fill
            value={value.trueValue.type}
            onChange={(e) =>
              onChange({
                ...value,
                trueValue: {
                  type: e.target.value as any,
                  data:
                    e.target.value === "expression"
                      ? "value / compareTo === 42 ? 'yes' : 'no'"
                      : undefined,
                },
              })
            }
          >
            <option value="value">Value</option>
            <option value="compareTo">Compare to value</option>
            <option value="expression">Custom expression</option>
          </HTMLSelect>
        </FormGroup>
        {value.trueValue.type === "expression" && (
          <FormGroup
            label="Expression to use if true:"
            helperText="Any JS expression is valid here. You may use 'value' and 'compareTo' variables in your expression."
          >
            <InputGroup
              value={value.trueValue.data}
              onChange={(e) => {
                onChange({
                  ...value,
                  trueValue: {
                    type: "expression",
                    data: e.target.value,
                  },
                });
              }}
            />
          </FormGroup>
        )}
        <FormGroup label="Value to emit if false" inline>
          <HTMLSelect
            fill
            value={value.falseValue.type}
            onChange={(e) =>
              onChange({
                ...value,
                falseValue: {
                  type: e.target.value as any,
                  data:
                    e.target.value === "expression"
                      ? "value / compareTo === 42 ? 'yes' : 'no'"
                      : undefined,
                },
              })
            }
          >
            <option value="value">Value</option>
            <option value="compareTo">Compare to value</option>
            <option value="expression">Custom expression</option>
          </HTMLSelect>
        </FormGroup>
        {value.falseValue.type === "expression" && (
          <FormGroup
            label="Expression to use if false:"
            helperText="Any JS expression is valid here. You may use 'value' and 'compareTo' variables in your expression."
          >
            <InputGroup
              value={value.falseValue.data}
              onChange={(e) => {
                onChange({
                  ...value,
                  falseValue: {
                    type: "expression",
                    data: e.target.value,
                  },
                });
              }}
            />
          </FormGroup>
        )}

        <Divider />
        <FormGroup helperText="If the input value is an object or a list, you can specify a path to the property that the condition will be applied to">
          <Checkbox
            label="Use property path for input value"
            checked={usePropPathValue}
            onChange={(e) => {
              const val = (e.target as HTMLInputElement).checked;
              setUsePropPathValue(val);
              onChange({
                ...value,
                propertyPath: val ? value.propertyPath : "",
              });
            }}
          />
        </FormGroup>
        {usePropPathValue && (
          <FormGroup
            label="Input value property path"
            helperText="If the input value is an object or a list, you can specify a path to the property that the condition will be applied to"
          >
            <InputGroup
              value={value.propertyPath}
              onChange={(e) =>
                onChange({
                  ...value,
                  propertyPath: e.target.value,
                })
              }
            />
          </FormGroup>
        )}
        {value.compareTo.mode === "dynamic" && (
          <>
            <Divider />
            <FormGroup helperText="If the compareTo value is an object or a list, you can specify a path to the property that the condition will be applied to">
              <Checkbox
                label="Use property path for compareTo value"
                checked={usePropPathCompareTo}
                onChange={(e) => {
                  const val = (e.target as HTMLInputElement).checked;
                  setUsePropPathCompareTo(val);
                  onChange({
                    ...value,
                    compareTo: {
                      mode: "dynamic",
                      propertyPath: val
                        ? value.compareTo.mode === "dynamic"
                          ? value.compareTo.propertyPath
                          : ""
                        : "",
                    },
                  });
                }}
              />
            </FormGroup>
          </>
        )}
        {value.compareTo.mode === "dynamic" && usePropPathCompareTo && (
          <FormGroup
            label="Compare to value property path"
            helperText="If the compare to value is an object or a list, you can specify a path to the property that the condition will be applied to"
          >
            <InputGroup
              value={value.compareTo.propertyPath}
              onChange={(e) =>
                onChange({
                  ...value,
                  compareTo: {
                    mode: "dynamic",
                    propertyPath: e.target.value,
                  },
                })
              }
            />
          </FormGroup>
        )}
      </>
    );
  };

export default ConditionalEditor;
