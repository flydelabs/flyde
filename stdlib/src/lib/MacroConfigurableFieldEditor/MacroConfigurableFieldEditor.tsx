import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Settings,
  AiGenerate,
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
  }, [changeType, config, value.type]);

  return (
    <div className="mb-4 group">
      <div className="mb-1 font-medium flex items-center gap-2 justify-between">
        {config.label}:
        {config.aiCompletion && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <AiGenerate
              prompt={config.aiCompletion.prompt}
              placeholder={config.aiCompletion.placeholder}
              jsonMode={config.aiCompletion.jsonMode}
              currentValue={value.value}
              onComplete={(text) => {
                try {
                  const parsed = JSON.parse(text);
                  onChange({ ...value, value: parsed });
                } catch {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange({ ...value, value: text } as any);
                }
              }}
            />
          </div>
        )}
      </div>
      <MacroConfigurableValueBaseEditor
        value={value}
        onChange={onChange}
        fieldDefinition={config}
        prompt={prompt}
      />

      {config.description && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
          {config.description}
        </div>
      )}
      {helperText}
    </div>
  );
}
