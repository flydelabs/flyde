import { useMemo } from "react";
import React from "react";
import { MacroEditorComp } from "@flyde/core";
import { SwitchConfig } from "./Switch.flyde";
import { Button, Input, Label, Separator, Checkbox } from "@flyde/ui";

const MAX_CASES = 6;

const SwitchEditor: MacroEditorComp<SwitchConfig> = function SwitchEditor(
  props
) {
  const { value, onChange } = props;

  const inputsElem = useMemo(() => {
    const inputs = value.inputs.map((input, i) => {
      return (
        <div key={i} style={{ marginBottom: "1rem" }}>
          <Label style={{ marginBottom: "0.5rem", display: "block" }}>
            Input name no. {i + 1}:
          </Label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Input
              value={input}
              onChange={(e) => {
                const newInputs = [...value.inputs];
                newInputs[i] = e.target.value;
                onChange({ ...value, inputs: newInputs });
              }}
            />
            {value.inputs.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newInputs = [...value.inputs];
                  newInputs.splice(i, 1);
                  onChange({ ...value, inputs: newInputs });
                }}
              >
                X
              </Button>
            )}
          </div>
        </div>
      );
    });
    return (
      <div>
        {inputs}
        {inputs.length < 6 && (
          <Button
            variant="outline"
            onClick={() => {
              const newInputs = [...value.inputs];
              newInputs.push(`value${newInputs.length + 1}`);
              onChange({ ...value, inputs: newInputs });
            }}
            style={{ marginTop: "0.5rem" }}
          >
            Add input
          </Button>
        )}
      </div>
    );
  }, [onChange, value]);

  const casesElem = useMemo(() => {
    const cases = value.cases.map((case_, i) => {
      return (
        <div key={i} style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <Label style={{ marginBottom: "0.5rem", display: "block" }}>
              Case no. {i + 1} name:
            </Label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Input
                value={case_.name}
                onChange={(e) => {
                  const newCases = [...value.cases];
                  newCases[i] = { ...newCases[i], name: e.target.value };
                  onChange({ ...value, cases: newCases });
                }}
              />
              {value.cases.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCases = [...value.cases];
                    newCases.splice(i, 1);
                    onChange({ ...value, cases: newCases });
                  }}
                >
                  X
                </Button>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <Label style={{ marginBottom: "0.5rem", display: "block" }}>
              Case no. {i + 1} condition expression:
            </Label>
            <Input
              value={case_.conditionExpression}
              onChange={(e) => {
                const newCases = [...value.cases];
                newCases[i] = {
                  ...newCases[i],
                  conditionExpression: e.target.value,
                };
                onChange({ ...value, cases: newCases });
              }}
            />
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666",
                marginTop: "0.25rem",
              }}
            >
              The condition to evaluate to check whether this case should be
              activated. any JS expression. You can access the inputs data using
              the inputs object.
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <Label style={{ marginBottom: "0.5rem", display: "block" }}>
              Case no. {i + 1} output expression:
            </Label>
            <Input
              value={case_.outputExpression}
              onChange={(e) => {
                const newCases = [...value.cases];
                newCases[i] = {
                  ...newCases[i],
                  outputExpression: e.target.value,
                };
                onChange({ ...value, cases: newCases });
              }}
            />
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666",
                marginTop: "0.25rem",
              }}
            >
              The expression to output if this case is activated. Accepts any JS
              expression. You can access the inputs data using the inputs
              object.
            </p>
          </div>
        </div>
      );
    });
    return (
      <div>
        {cases}
        {cases.length < MAX_CASES && (
          <Button
            variant="outline"
            onClick={() => {
              const newCases = [...value.cases];
              newCases.push({
                name: `case${newCases.length + 1}`,
                conditionExpression: "",
                outputExpression: "",
              });
              onChange({ ...value, cases: newCases });
            }}
            style={{ marginTop: "0.5rem" }}
          >
            Add case
          </Button>
        )}
      </div>
    );
  }, [onChange, value]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {inputsElem}
      <Separator />
      {casesElem}
      <Separator />
      <div>
        <div style={{ marginBottom: "1rem" }}>
          <Checkbox
            checked={value.defaultCase.enabled}
            onCheckedChange={(checked) => {
              onChange({
                ...value,
                defaultCase: {
                  enabled: !!checked,
                  outputExpression: checked ? "" : undefined,
                },
              });
            }}
            label="Enable default case (if no case is activated). If disabled, reaching a case that is not activated will output an error."
          />
        </div>
        {value.defaultCase.enabled && (
          <div>
            <Label style={{ marginBottom: "0.5rem", display: "block" }}>
              Default case output expression:
            </Label>
            <Input
              value={value.defaultCase.outputExpression}
              onChange={(e) => {
                onChange({
                  ...value,
                  defaultCase: {
                    enabled: true,
                    outputExpression: e.target.value,
                  },
                });
              }}
            />
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666",
                marginTop: "0.25rem",
              }}
            >
              The expression to output if no case is activated. Accepts any JS
              expression. You can access the inputs data using the inputs
              object.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwitchEditor;
