import React from "react";
import { FormGroup, InputGroup } from "@blueprintjs/core";
import { ConfigurableInputEditor } from "./ConfigurableInputEditor";
import { ConfigurableInput, MacroEditorComp } from "@flyde/core";

export function SimpleStringMacroEditor<K extends string>(
  key: K,
  label: string
): MacroEditorComp<{ [P in K]: ConfigurableInput<{ value: string }> }> {
  const Editor: MacroEditorComp<{
    [P in K]: ConfigurableInput<{ value: string }>;
  }> = function Editor({ value, onChange }) {
    return (
      <ConfigurableInputEditor
        value={value[key]}
        onChange={(newValue) => onChange({ ...value, [key]: newValue })}
        valueRenderer={(vrProps) => (
          <FormGroup label={label} inline>
            <InputGroup
              value={vrProps.value.value}
              onChange={(e) =>
                vrProps.onChange({
                  ...vrProps.value,
                  value: e.target.value,
                })
              }
            />
          </FormGroup>
        )}
        modeLabel="Key:"
        defaultStaticValue={{ value: "" }}
      />
    );
  };
  return Editor;
}
