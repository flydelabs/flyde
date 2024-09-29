import {
  Checkbox,
  FormGroup,
  HTMLSelect,
  InputGroup,
  NumericInput,
  TextArea,
} from "@blueprintjs/core";
import {
  MacroEditorComp,
  MacroEditorConfigStructured,
  MacroEditorFieldDefinition,
  MacroEditorFieldDefinitionType,
  MacroEditorFieldDefinitionTypeLongText,
  MacroEditorFieldDefinitionTypeSelect,
} from "@flyde/core";
import { SimpleJsonEditor } from "./SimpleJsonEditor";
import { ConfigurableInputEditor } from "./ConfigurableInputEditor";
import { useState, useEffect } from "react";
import { usePrompt } from "../../flow-editor/ports";

export interface ValueCompProps<T> {
  value: T;
  onChange: (value: T) => void;
}

export function MacroEditorBaseValueComp(
  props: ValueCompProps<any> & { config: MacroEditorFieldDefinitionType }
) {
  const _prompt = usePrompt();
  const [options, setOptions] = useState<
    { value: string | number; label: string }[]
  >((props.config as MacroEditorFieldDefinitionTypeSelect).items || []);

  useEffect(() => {
    if (
      props.config.value === "select" &&
      !options.some((option) => option.value === props.value)
    ) {
      setOptions([
        ...options,
        { value: props.value, label: String(props.value) },
      ]);
    }
  }, [props.value, options, props.config.value]);

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

  switch (props.config.value) {
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
          label={props.config.label}
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
            (props.config as MacroEditorFieldDefinitionTypeLongText).rows ?? 5
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
  if (props.config.allowDynamic) {
    return (
      <ConfigurableInputEditor
        value={props.value}
        onChange={props.onChange}
        valueRenderer={(rendererProps) => (
          <FormGroup label={`${config.label}:`}>
            <MacroEditorBaseValueComp
              value={rendererProps.value}
              onChange={rendererProps.onChange}
              config={props.config.type}
            />
          </FormGroup>
        )}
        modeLabel={`${props.config.label} mode:`}
        defaultStaticValue={props.config.defaultValue}
      />
    );
  } else {
    return (
      <FormGroup label={`${config.label}:`}>
        <MacroEditorBaseValueComp
          value={props.value}
          onChange={props.onChange}
          config={props.config.type}
        />
      </FormGroup>
    );
  }
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
