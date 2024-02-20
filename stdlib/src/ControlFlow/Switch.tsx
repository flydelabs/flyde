import { useMemo } from "react";
import {
  Button,
  Checkbox,
  Divider,
  FormGroup,
  InputGroup,
} from "@blueprintjs/core";
import React from "react";
import { MacroEditorComp } from "@flyde/core";
import { SwitchConfig } from "./Switch.flyde";

const MAX_CASES = 6;

const SwitchEditor: MacroEditorComp<SwitchConfig> = function SwitchEditor(
  props
) {
  const { value, onChange } = props;

  const inputsElem = useMemo(() => {
    const inputs = value.inputs.map((input, i) => {
      return (
        <FormGroup key={i} label={`Input name no. ${i + 1}:`} inline>
          <InputGroup
            value={input}
            onChange={(e) => {
              const newInputs = [...value.inputs];
              newInputs[i] = e.target.value;
              onChange({ ...value, inputs: newInputs });
            }}
            rightElement={
              value.inputs.length > 1 ? (
                <Button
                  small
                  minimal
                  intent="danger"
                  onClick={() => {
                    const newInputs = [...value.inputs];
                    newInputs.splice(i, 1);
                    onChange({ ...value, inputs: newInputs });
                  }}
                >
                  X
                </Button>
              ) : null
            }
          />
        </FormGroup>
      );
    });
    return (
      <>
        {inputs}
        {inputs.length < 6 ? (
          <Button
            onClick={() => {
              const newInputs = [...value.inputs];
              newInputs.push(`value${newInputs.length + 1}`);
              onChange({ ...value, inputs: newInputs });
            }}
          >
            Add input
          </Button>
        ) : null}
      </>
    );
  }, [onChange, value]);

  const casesElem = useMemo(() => {
    const cases = value.cases.map((case_, i) => {
      return (
        <>
          <FormGroup key={i} label={`Case no. ${i + 1} name:`}>
            <InputGroup
              value={case_.name}
              rightElement={
                value.cases.length > 1 && (
                  <Button
                    small
                    minimal
                    intent="danger"
                    onClick={() => {
                      const newCases = [...value.cases];
                      newCases.splice(i, 1);
                      onChange({ ...value, cases: newCases });
                    }}
                  >
                    X
                  </Button>
                )
              }
              onChange={(e) => {
                const newCases = [...value.cases];
                newCases[i] = { ...newCases[i], name: e.target.value };
                onChange({ ...value, cases: newCases });
              }}
            />
          </FormGroup>
          <FormGroup
            key={i}
            label={`Case no. ${i + 1} condition expression:`}
            helperText="The condition to evaluate to check whether this case should be activated. any JS expression. You can access the inputs data using the inputs object. For example, `inputs.name !== inputs['city of birth']`"
          >
            <InputGroup
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
          </FormGroup>
          <FormGroup
            key={i}
            label={`Case no. ${i + 1} output expression:`}
            helperText="The expression to output if this case is activated. Accepts any JS expression. You can access the inputs data using the inputs object. For example, `inputs.name`"
          >
            <InputGroup
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
          </FormGroup>
        </>
      );
    });
    return (
      <>
        {cases}
        {cases.length < MAX_CASES ? (
          <Button
            onClick={() => {
              const newCases = [...value.cases];
              newCases.push({
                name: `case${newCases.length + 1}`,
                conditionExpression: "",
                outputExpression: "",
              });
              onChange({ ...value, cases: newCases });
            }}
          >
            Add case
          </Button>
        ) : null}
      </>
    );
  }, [onChange, value]);

  return (
    <>
      {inputsElem}
      <Divider />
      {casesElem}
      <Divider />
      <FormGroup>
        <Checkbox
          checked={value.defaultCase.enabled}
          label="Enable default case (if no case is activated). If disabled, reaching a case that is not activated will output an error."
          onChange={(e) => {
            const enabled = (e.target as HTMLInputElement).checked;
            onChange({
              ...value,
              defaultCase: {
                enabled,
                outputExpression: enabled ? "" : undefined,
              },
            });
          }}
        />
      </FormGroup>
      {value.defaultCase.enabled ? (
        <FormGroup
          label="Default case output expression:"
          helperText="The expression to output if no case is activated. Accepts any JS expression. You can access the inputs data using the inputs object. For example, `inputs.name`"
        >
          <InputGroup
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
        </FormGroup>
      ) : null}
    </>
  );
};

export default SwitchEditor;
