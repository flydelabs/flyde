import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Checkbox,
} from "@flyde/ui";
import {
  LongTextFieldDefinition,
  MacroConfigurableValue,
  MacroEditorFieldDefinition,
} from "@flyde/core";
import { SimpleJsonEditor } from "../SimpleJsonEditor";
import { useState, useEffect } from "react";
import React from "react";

const inputStyles = {
  width: "100%",
};

export function MacroConfigurableValueBaseEditor(props: {
  value: MacroConfigurableValue;
  onChange: (value: MacroConfigurableValue) => void;
  prompt: (message: string) => Promise<string>;
  fieldDefinition: MacroEditorFieldDefinition;
}) {
  const { value, onChange, fieldDefinition, prompt: _prompt } = props;
  const [options, setOptions] = useState<
    { value: string | number; label: string }[]
  >(
    (fieldDefinition.type === "select"
      ? fieldDefinition.typeData.options
      : []
    ).map((opt) =>
      typeof opt === "object" ? opt : { value: opt, label: String(opt) }
    ) || []
  );

  useEffect(() => {
    if (
      fieldDefinition.type === "select" &&
      !options.some((option) => option.value === value.value) &&
      fieldDefinition.typeConfigurable !== false
    ) {
      setOptions([
        ...options,
        { value: value.value, label: String(value.value) },
      ]);
    }
  }, [value, options, fieldDefinition.type, fieldDefinition.typeConfigurable]);

  const handleAddOption = async () => {
    if (fieldDefinition.typeConfigurable === false) {
      return; // Don't allow adding options when typeConfigurable is false
    }

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
        <Input
          type="number"
          value={value.value as number}
          onChange={(e) =>
            props.onChange({
              type: "number",
              value: parseFloat(e.target.value),
            })
          }
          style={inputStyles}
        />
      );
    case "string": {
      if (fieldDefinition.type === "longtext") {
        return (
          <Textarea
            value={value.value as string}
            onChange={(e) =>
              props.onChange({ type: "string", value: e.target.value })
            }
            rows={
              (fieldDefinition as LongTextFieldDefinition).typeData?.rows ?? 5
            }
            style={inputStyles}
          />
        );
      } else {
        return (
          <Input
            value={value.value as string}
            onChange={(e) =>
              props.onChange({ type: "string", value: e.target.value })
            }
            style={inputStyles}
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
          onCheckedChange={(checked) =>
            props.onChange({ type: "boolean", value: checked === true })
          }
        />
      );
    case "select": {
      return (
        <Select
          value={String(value.value)}
          onValueChange={(val) => {
            if (val === "__other__") {
              handleAddOption();
            } else {
              props.onChange({ type: "select", value: val });
            }
          }}
        >
          <SelectTrigger style={inputStyles}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={String(option.value)}
                value={String(option.value)}
              >
                {option.label}
              </SelectItem>
            ))}
            {fieldDefinition.typeConfigurable !== false && (
              <SelectItem value="__other__">Other (add new option)</SelectItem>
            )}
          </SelectContent>
        </Select>
      );
    }
    case "dynamic":
      return (
        <Input
          value={`{{${fieldDefinition.configKey}}}`}
          disabled
          style={inputStyles}
        />
      );
  }
}
