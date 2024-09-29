import {
  Checkbox,
  FormGroup,
  HTMLSelect,
  InputGroup,
  NumericInput,
  TextArea,
} from "@blueprintjs/core";
import {
  LongTextFieldDefinition,
  MacroEditorComp,
  MacroEditorConfigStructured,
  MacroEditorFieldDefinition,
} from "@flyde/core";
import { SimpleJsonEditor } from "./SimpleJsonEditor";
import { useState, useEffect } from "react";
import { usePrompt } from "../../flow-editor/ports";

export interface ValueCompProps<T> {
  value: T;
  onChange: (value: T) => void;
}

export function MacroEditorBaseValueComp(
  props: ValueCompProps<any> & { fieldDefinition: MacroEditorFieldDefinition }
) {
  const _prompt = usePrompt();
  const [options, setOptions] = useState<
    { value: string | number; label: string }[]
  >(
    (props.fieldDefinition.type === "select"
      ? props.fieldDefinition.typeData.items
      : []) || []
  );

  useEffect(() => {
    if (
      props.fieldDefinition.type === "select" &&
      !options.some((option) => option.value === props.value)
    ) {
      setOptions([
        ...options,
        { value: props.value, label: String(props.value) },
      ]);
    }
  }, [props.value, options, props.fieldDefinition.type]);

  const handleAddOption = async () => {
    const newOption = await _prompt("Enter a new option:");
    if (newOption && !options.some((option) => option.value === newOption)) {
      const updatedOptions = [
        ...options,
        { value: newOption, label: newOption },
      ];
      setOptions(updatedOptions);
      props.onChange(newOption);
    }
  };

  switch (props.fieldDefinition.type) {
    case "number":
      return (
        <NumericInput
          value={props.value}
          onValueChange={(e) => props.onChange(e)}
          fill
        />
      );
    case "string":
      return (
        <InputGroup
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          // fill
        />
      );
    case "json":
      return (
        <SimpleJsonEditor
          value={props.value}
          onChange={(e) => props.onChange(e)}
          label={props.fieldDefinition.label}
        />
      );
    case "boolean":
      return (
        <Checkbox
          checked={props.value}
          onChange={(e) =>
            props.onChange((e.target as HTMLInputElement).checked)
          }
        />
      );
    case "select": {
      return (
        <HTMLSelect
          value={props.value}
          onChange={(e) => {
            if (e.target.value === "__other__") {
              handleAddOption();
            } else {
              props.onChange(e.target.value);
            }
          }}
          fill
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value="__other__">Other (add new option)</option>
        </HTMLSelect>
      );
    }
    case "longtext":
      return (
        <TextArea
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          rows={
            (props.fieldDefinition as LongTextFieldDefinition).typeData?.rows ??
            5
          }
          fill
        />
      );
  }
}

export function MacroEditorFieldDefinitionRenderer(
  props: ValueCompProps<any> & { config: MacroEditorFieldDefinition }
) {
  const { config } = props;
  return (
    <FormGroup label={`${config.label}:`}>
      <MacroEditorBaseValueComp
        value={props.value}
        onChange={props.onChange}
        fieldDefinition={props.config}
      />
    </FormGroup>
  );
}

export function buildStructuredMacroEditorComp<T>(
  editorConfig: MacroEditorConfigStructured
): MacroEditorComp<T> {
  return (props) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {editorConfig.fields.map((field) => (
          <MacroEditorFieldDefinitionRenderer
            key={field.configKey}
            value={props.value[field.configKey]}
            onChange={(newValue) =>
              props.onChange({
                ...props.value,
                [field.configKey]: newValue,
              })
            }
            config={field}
          />
        ))}
      </div>
    );
  };
}
