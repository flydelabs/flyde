import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Settings,
} from "@flyde/ui";
import {
  MacroConfigurableValue,
  MacroEditorFieldDefinition,
} from "@flyde/core";
import { MacroConfigurableValueBaseEditor } from "./MacroConfigurableValueBaseEditor";
import { useCallback, useMemo } from "react";
import { convertValue } from "./convertValues";
import React from "react";

export function MacroConfigurableFieldEditor(props: {
  value: MacroConfigurableValue;
  onChange: (value: MacroConfigurableValue) => void;
  config: MacroEditorFieldDefinition;
  prompt: (message: string) => Promise<string>;
}) {
  const { config, value, onChange, prompt } = props;

  const changeType = useCallback(
    (newType: MacroConfigurableValue["type"]) => {
      const newValue = convertValue(value.type, newType, value.value);
      onChange({ type: newType, value: newValue });
    },
    [value, onChange]
  );

  const helperText = useMemo(() => {
    const isTemplateSupported =
      (value.type === "string" || value.type === "json") &&
      config.templateSupport !== false;

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "4px",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <span>
          {isTemplateSupported
            ? "Use {{ }} to insert variables. For example {{myVar}}"
            : ""}
        </span>
        {config.typeConfigurable !== false ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <Settings className="h-4 w-4 mr-2" />
                Change type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeType("dynamic")}>
                Dynamic
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeType("number")}>
                Number
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeType("boolean")}>
                Boolean
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeType("json")}>
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeType("string")}>
                String
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    );
  }, [changeType, config.templateSupport, config.typeConfigurable, value.type]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ marginBottom: "4px", fontWeight: 500 }}>
        {config.label}:
      </div>
      <MacroConfigurableValueBaseEditor
        value={value}
        onChange={onChange}
        fieldDefinition={config}
        prompt={prompt}
      />
      {helperText}
    </div>
  );
}
