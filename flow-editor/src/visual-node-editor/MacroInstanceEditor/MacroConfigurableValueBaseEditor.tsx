import {
  Checkbox,
  HTMLSelect,
  InputGroup,
  NumericInput,
  TextArea,
} from "@blueprintjs/core";
import {
  LongTextFieldDefinition,
  MacroConfigurableValue,
  MacroEditorFieldDefinition,
} from "@flyde/core";
import { SimpleJsonEditor } from "./SimpleJsonEditor";
import { useState, useEffect } from "react";
import { usePrompt } from "../../flow-editor/ports";

export function MacroConfigurableValueBaseEditor(props: {
  value: MacroConfigurableValue;
  onChange: (value: MacroConfigurableValue) => void;
  fieldDefinition: MacroEditorFieldDefinition;
}) {
  const { value, onChange, fieldDefinition } = props;
  const _prompt = usePrompt();
  const [options, setOptions] = useState<
    { value: string | number; label: string }[]
  >(
    (fieldDefinition.type === "select" ? fieldDefinition.typeData.items : []) ||
      []
  );

  useEffect(() => {
    if (
      fieldDefinition.type === "select" &&
      !options.some((option) => option.value === value.value)
    ) {
      setOptions([
        ...options,
        { value: value.value, label: String(value.value) },
      ]);
    }
  }, [value, options, fieldDefinition.type]);

  const handleAddOption = async () => {
    const newOption = await _prompt("Enter a new option:");
    if (newOption && !options.some((option) => option.value === newOption)) {
      const updatedOptions = [
        ...options,
        {
          value: newOption,
          label: newOption,
        },
      ];
      setOptions(updatedOptions);
      onChange({ type: "select", value: newOption });
    }
  };

  switch (value.type) {
    case "number":
      return (
        <NumericInput
          value={value.value as number}
          onValueChange={(value) => props.onChange({ type: "number", value })}
          fill
        />
      );
    // eslint-disable-next-line no-lone-blocks
    case "string": {
      if (fieldDefinition.type === "longtext") {
        return (
          <TextArea
            value={value.value as string}
            onChange={(e) =>
              props.onChange({ type: "string", value: e.target.value })
            }
            rows={
              (fieldDefinition as LongTextFieldDefinition).typeData?.rows ?? 5
            }
            fill
          />
        );
      } else {
        return (
          <InputGroup
            value={value.value as string}
            onChange={(e) =>
              props.onChange({ type: "string", value: e.target.value })
            }
          />
        );
      }
    }
    case "json":
      return (
        <SimpleJsonEditor
          value={value.value}
          onChange={(value) => props.onChange({ type: "json", value })}
        />
      );
    case "boolean":
      return (
        <Checkbox
          checked={value.value as boolean}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            props.onChange({ type: "boolean", value: e.target.checked })
          }
        />
      );
    case "select": {
      return (
        <HTMLSelect
          value={value.value}
          onChange={(e) => {
            if (e.target.value === "__other__") {
              handleAddOption();
            } else {
              props.onChange({ type: "select", value: e.target.value });
            }
          }}
          fill
        >
          {options.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value="__other__">Other (add new option)</option>
        </HTMLSelect>
      );
    }
    case "dynamic":
      return <InputGroup value={`{{${fieldDefinition.configKey}}}`} disabled />;
  }
}
