
import {
  LongTextFieldDefinition,
  ConfigurableValue,
  ConfigurableFieldDefinition,
  PartialEditorPorts,
} from "@flyde/core";
import { SimpleJsonEditor } from "../SimpleJsonEditor";
import { useState, useEffect } from "react";
import { SecretSelector } from "./SecretSelector";
import { Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "../..";

const inputClassName = "w-full";

export function ConfigurableValueBaseEditor(props: {
  value: ConfigurableValue;
  onChange: (value: ConfigurableValue) => void;
  fieldDefinition: ConfigurableFieldDefinition;
  isExpanded?: boolean;
  rawJsonData?: string;
  onRawJsonDataChange?: (rawData: string) => void;
  ports: PartialEditorPorts;
}) {
  const {
    value,
    onChange,
    fieldDefinition,
    ports,
    isExpanded,
    rawJsonData,
    onRawJsonDataChange,
  } = props;

  const { prompt: _prompt } = ports;
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

  // Track raw JSON data internally if not provided from parent
  const [internalRawJsonData, setInternalRawJsonData] = useState<string>(
    rawJsonData ||
    (value.type === "json" ? JSON.stringify(value.value, null, 2) : "")
  );

  // Update internal state when rawJsonData prop changes
  useEffect(() => {
    if (rawJsonData !== undefined && value.type === "json") {
      setInternalRawJsonData(rawJsonData);
    }
  }, [rawJsonData, value.type]);

  // Handle raw JSON data changes
  const handleRawJsonDataChange = (rawData: string) => {
    setInternalRawJsonData(rawData);
    if (onRawJsonDataChange) {
      onRawJsonDataChange(rawData);
    }
  };

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

    const newOption = await _prompt({ text: "Enter a new option:" });
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
          min={fieldDefinition.type === "number" && fieldDefinition.typeData?.min !== undefined ? fieldDefinition.typeData.min : undefined}
          max={fieldDefinition.type === "number" && fieldDefinition.typeData?.max !== undefined ? fieldDefinition.typeData.max : undefined}
          className={inputClassName}
        />
      );
    case "string": {
      // Special handling for secrets
      if (fieldDefinition.type === "secret" && ports) {
        return (
          <SecretSelector
            value={value.value as string}
            onChange={(newValue) => props.onChange({ type: "string", value: newValue })}
            ports={ports}
            typeEditorData={fieldDefinition.typeData}
          />
        );
      }

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
            style={{
              minWidth: isExpanded ? "65vw" : "100%",
              height: isExpanded ? "65vh" : undefined,
            }}
          />
        );
      } else {
        return (
          <Input
            value={value.value as string}
            onChange={(e) =>
              props.onChange({ type: "string", value: e.target.value })
            }
            className={inputClassName}
          />
        );
      }
    }
    case "json":
      return (
        <SimpleJsonEditor
          value={value.value}
          onChange={(value) => props.onChange({ type: "json", value })}
          isExpanded={isExpanded}
          rawData={rawJsonData || internalRawJsonData}
          onChangeRaw={handleRawJsonDataChange}
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
          <SelectTrigger className={inputClassName}>
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
          className={inputClassName}
        />
      );
    default:
      return (
        <span className="text-gray-500 dark:text-gray-400 italic">
          Trying to render unsupported type: [
          {(value as unknown as { type: string })?.type}]
        </span>
      );
  }
}
