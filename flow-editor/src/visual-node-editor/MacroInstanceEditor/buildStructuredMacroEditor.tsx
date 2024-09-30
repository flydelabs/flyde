import { Button, FormGroup } from "@blueprintjs/core";
import {
  MacroConfigurableValue,
  MacroEditorComp,
  MacroEditorConfigStructured,
  MacroEditorFieldDefinition,
} from "@flyde/core";
import { MacroConfigurableValueBaseEditor } from "./MacroConfigurableValueBaseEditor";
import { useCallback } from "react";

function convertValue(
  oldType: MacroConfigurableValue["type"],
  newType: MacroConfigurableValue["type"],
  value: any
): any {
  switch (newType) {
    case "string": {
      switch (oldType) {
        case "json": {
          return JSON.stringify(value);
        }
        default: {
          return value.toString();
        }
      }
    }
    case "number": {
      switch (oldType) {
        case "string":
        case "json": {
          const parsed = parseFloat(value);
          if (isNaN(parsed)) {
            return 0;
          }
          return parsed;
        }
        default: {
          return value;
        }
      }
    }
    case "boolean": {
      switch (oldType) {
        case "json":
        case "string": {
          return value === "true" || value === "1";
        }
        default: {
          return !!value;
        }
      }
    }
    case "json": {
      return JSON.stringify(value);
    }
    default: {
      return value;
    }
  }
}

export function MacroEditorFieldDefinitionRenderer(props: {
  value: MacroConfigurableValue;
  onChange: (value: MacroConfigurableValue) => void;
  config: MacroEditorFieldDefinition;
}) {
  const { config, value, onChange } = props;

  const changeType = useCallback(
    (newType: MacroConfigurableValue["type"]) => {
      const newValue = convertValue(value.type, newType, value.value);
      onChange({ type: newType, value: newValue });
    },
    [value, onChange]
  );

  return (
    <FormGroup label={`${config.label}:`}>
      <MacroConfigurableValueBaseEditor
        value={props.value}
        onChange={props.onChange}
        fieldDefinition={props.config}
      />
      <div>
        <span>Type: {props.value.type}</span>
        <Button onClick={() => changeType("dynamic")}>Make dynamic</Button>
        <Button onClick={() => changeType("number")}>Make number</Button>
      </div>
    </FormGroup>
  );
}

export function StructuredMacroEditorComp<T>(
  editorConfig: MacroEditorConfigStructured
): MacroEditorComp<T> {
  return (props) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
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
